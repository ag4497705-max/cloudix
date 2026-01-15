import type { NextApiRequest, NextApiResponse } from "next";
import JSZip from "jszip";
import prisma from "../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.warn("Warning: OPENAI_API_KEY is not set. Set it in environment to enable generation.");
}

/**
 * POST /api/generate
 * body: { prompt: string, packName?: string, preview?: boolean }
 *
 * Behavior:
 * - Validates session & permissions (credits / Pro / lifetime)
 * - Calls OpenAI to produce a strict JSON describing generated files
 * - If preview=true: returns the parsed JSON (files list) to client for preview
 * - If preview=false: builds a ZIP with the files and returns it as application/zip
 *
 * Expected model JSON shape:
 * {
 *   "pack_name": "my-datapack",
 *   "files": [
 *     { "path": "pack.mcmeta", "content": "{...}" },
 *     { "path": "data/my_namespace/functions/start.mcfunction", "content": "say Hello" }
 *   ]
 * }
 */

async function callOpenAI(prompt: string, packName: string) {
  // system + user messages instructing model to return JSON only
  const system = `You are a code generator that outputs a JSON object describing files to create for a Minecraft datapack.
Return only valid JSON (no surrounding backticks, no extra text). The JSON MUST be parseable by JSON.parse.
Output format:
{
  "pack_name": "<folder name for datapack>",
  "files": [
    { "path": "pack.mcmeta", "content": "<file content as string>" },
    { "path": "data/<namespace>/functions/<file>.mcfunction", "content": "<mcfunction contents>" }
  ]
}
Notes:
- Use pack_name exactly as provided by the user if possible (sanitize to safe folder name).
- Escape newlines in content as actual newline characters in the JSON strings (the JSON parser will handle them).
- Keep file contents valid for Minecraft datapack format.
- Do not include any extra commentary.`;

  const userMessage = `Pack name: ${packName}
Requirements / prompt:
${prompt}

Create the minimal set of files needed for the described datapack. Keep each file reasonably short but functional.`;

  const body = {
    model: "gpt-4o-mini", // change if you prefer another model
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ],
    max_tokens: 2000,
    temperature: 0.2,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  return text;
}

function safeFolderName(name: string) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 60) || "generated-datapack";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt, packName: rawPackName = "my-datapack", preview = false } = req.body ?? {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing prompt" });
  }

  // get auth session
  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ error: "User not found" });

  // Check access / credits
  const isProOrLifetime = !!user.isPro || !!user.isLifetime;
  if (!isProOrLifetime && (user.credits ?? 0) <= 0) {
    return res.status(402).json({ error: "No credits. Upgrade to Pro." });
  }

  // call model
  let modelText: string;
  try {
    const packName = safeFolderName(rawPackName);
    modelText = await callOpenAI(prompt, packName);
  } catch (err: any) {
    console.error("Generation error:", err);
    return res.status(500).json({ error: "Generation failed: " + String(err.message ?? err) });
  }

  // Try to extract JSON from modelText (strip non-json prefix/suffix)
  let parsed: any;
  try {
    // Find first { and last } to extract JSON
    const first = modelText.indexOf("{");
    const last = modelText.lastIndexOf("}");
    const candidate = first >= 0 && last >= 0 ? modelText.slice(first, last + 1) : modelText;
    parsed = JSON.parse(candidate);
  } catch (err) {
    console.error("Failed to parse model JSON:", err, "raw:", modelText);
    return res.status(500).json({ error: "Failed to parse model output as JSON", raw: modelText });
  }

  // Basic validation
  if (!parsed.files || !Array.isArray(parsed.files)) {
    return res.status(500).json({ error: "Model JSON missing files array", raw: parsed });
  }

  // If preview requested, return parsed JSON (do not consume credit or update DB here)
  if (preview) {
    return res.status(200).json({ pack_name: parsed.pack_name ?? rawPackName, files: parsed.files });
  }

  // Deduct a credit for non-Pro users (Pro & lifetime are unlimited here)
  if (!isProOrLifetime) {
    await prisma.user.update({ where: { id: user.id }, data: { credits: { decrement: 1 } } });
  }

  // Build zip
  const zip = new JSZip();
  const rootFolder = safeFolderName(parsed.pack_name ?? rawPackName);
  for (const f of parsed.files) {
    if (!f.path || typeof f.content !== "string") continue;
    const finalPath = `${rootFolder}/${f.path}`;
    zip.file(finalPath, f.content);
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${rootFolder}.zip"`);
  res.send(buffer);
}
