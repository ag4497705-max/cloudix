import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [packName, setPackName] = useState("my-datapack");
  const [previewFiles, setPreviewFiles] = useState<{ path: string; content: string }[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function doPreview() {
    if (!session) return signIn();
    setLoading(true);
    setPreviewFiles(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, packName, preview: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Preview failed");
      setPreviewFiles(json.files ?? []);
    } catch (err: any) {
      alert("Preview error: " + String(err.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  async function doDownload() {
    if (!session) return signIn();
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, packName, preview: false }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Generation failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${packName || "datapack"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Download error: " + String(err.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: 24, fontFamily: "system-ui" }}>
      <h1>Minecraft Datapack Generator</h1>

      <div style={{ marginTop: 12 }}>
        <label>
          Pack folder name:
          <input
            value={packName}
            onChange={(e) => setPackName(e.target.value)}
            style={{ marginLeft: 8, padding: 6 }}
          />
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the datapack behavior you'd like (e.g., 'A minigame that gives players a scoreboard and a command to start rounds')."
          rows={8}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
        <button onClick={doPreview} disabled={loading}>
          Preview files
        </button>
        <button onClick={doDownload} disabled={loading}>
          Generate & Download ZIP
        </button>
        {!session && (
          <button onClick={() => signIn()}>
            Sign in to generate
          </button>
        )}
      </div>

      {loading && <p style={{ color: "#666" }}>Generating…</p>}

      {previewFiles && (
        <section style={{ marginTop: 16 }}>
          <h2>Preview</h2>
          <ul>
            {previewFiles.map((f, i) => (
              <li key={i} style={{ marginBottom: 12 }}>
                <strong>{f.path}</strong>
                <pre style={{ background: "#f6f6f8", padding: 8, whiteSpace: "pre-wrap" }}>{f.content}</pre>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
