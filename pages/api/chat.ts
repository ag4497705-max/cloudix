import fetch from "isomorphic-fetch";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Missing prompt" });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ error: "Server missing OPENAI_API_KEY" });

  try {
    // Using Chat Completions endpoint as an example
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // replace with the model you want and have access to
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512,
      }),
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return res.status(502).json({ error: "Upstream error", details: text });
    }

    const json = await apiRes.json();
    // Chat Completions shape: json.choices[0].message.content
    const aiText = json?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ text: aiText });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
