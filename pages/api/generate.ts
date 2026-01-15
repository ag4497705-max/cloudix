import type { NextApiRequest, NextApiResponse } from "next";
import JSZip from "jszip";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  // 1) Call model provider here (OpenAI/HF) using server-side API key
  // 2) Receive generated file contents (e.g., mcfunction content)
  // For demo, we create a tiny datapack
  const zip = new JSZip();
  zip.folder("my-datapack")!.file("pack.mcmeta", JSON.stringify({ pack: { pack_format: 6, description: "Generated pack" } }));
  zip.folder("my-datapack/data/minecraft/functions")!.file("hello.mcfunction", "say Hello from generated datapack");
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="datapack.zip"');
  res.send(buf);
}
