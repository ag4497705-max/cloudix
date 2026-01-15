import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  async function goCheckout(price: "monthly" | "yearly") {
    setLoading(true);
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price }),
    });
    const { url, error } = await res.json();
    setLoading(false);
    if (error) return alert(error);
    window.location.href = url;
  }

  async function generate() {
    if (!session) return signIn();
    setLoading(true);
    const res = await fetch("/api/generate", { method: "POST" });
    const json = await res.json();
    setLoading(false);
    alert(JSON.stringify(json));
  }

  return (
    <main style={{ maxWidth: 800, margin: 24 }}>
      <h1>Minecraft AI — Pro Subscriptions</h1>

      <div>
        {session ? (
          <>
            <p>Signed in as {session.user.email}</p>
            <button onClick={() => signOut()}>Sign out</button>
          </>
        ) : (
          <button onClick={() => signIn()}>Sign in (email)</button>
        )}
      </div>

      <section style={{ marginTop: 20 }}>
        <h2>Pricing</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ border: "1px solid #ddd", padding: 12 }}>
            <h3>$10 / month</h3>
            <p>Pro features: infinite chat, 100 extra generation credits</p>
            <button disabled={!session || loading} onClick={() => goCheckout("monthly")}>
              Buy Monthly
            </button>
          </div>

          <div style={{ border: "1px solid #ddd", padding: 12 }}>
            <h3>$100 / year</h3>
            <p>Pro features: infinite chat, 100 extra generation credits</p>
            <button disabled={!session || loading} onClick={() => goCheckout("yearly")}>
              Buy Yearly
            </button>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Generate (gated)</h2>
        <button onClick={generate} disabled={loading}>
          Use generation endpoint (consumes credits / or allowed by Pro)
        </button>
      </section>

      <p style={{ marginTop: 20, color: "#666" }}>
        Note: nood2proinbloxfruit@gmail.com will be seeded as lifetime Pro when you run the seed script.
      </p>
    </main>
  );
}
