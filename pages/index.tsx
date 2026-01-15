import { useState } from "react";
export default function Page() {
  const [prompt, setPrompt] = useState("");
  async function gen() {
    const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ prompt })});
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "datapack.zip"; a.click();
    URL.revokeObjectURL(url);
  }
  return (<div>
    <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe the datapack or mod..." />
    <button onClick={gen}>Generate</button>
  </div>);
}
