import { useState } from "react";

type Message = { from: "user" | "ai"; text: string };

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput("");
    setMessages((m) => [...m, { from: "user", text: userText }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const aiText = data.text ?? "No response";
      setMessages((m) => [...m, { from: "ai", text: aiText }]);
    } catch (err) {
      setMessages((m) => [...m, { from: "ai", text: "Error: " + String(err) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "24px auto", fontFamily: "system-ui" }}>
      <h1>AI Website — Chat MVP</h1>
      <div style={{ border: "1px solid #ddd", padding: 12, minHeight: 240 }}>
        {messages.length === 0 && <p style={{ color: "#666" }}>Say hi — ask the AI something.</p>}
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "8px 0" }}>
            <b style={{ color: m.from === "user" ? "#0b5cff" : "#0c8f5b" }}>
              {m.from === "user" ? "You" : "AI"}
            </b>
            <div style={{ marginTop: 4 }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ color: "#888", marginTop: 8 }}>Thinking…</div>}
      </div>

      <div style={{ display: "flex", marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a prompt and press Enter"
          style={{ flex: 1, padding: 10, fontSize: 16 }}
        />
        <button onClick={send} style={{ marginLeft: 8, padding: "10px 16px" }} disabled={loading}>
          Send
        </button>
      </div>
      <p style={{ color: "#666", marginTop: 12, fontSize: 14 }}>
        Tip: set your OPENAI_API_KEY in environment variables for the server route.
      </p>
    </div>
  );
}
