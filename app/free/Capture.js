"use client";
import { useState } from "react";
export default function Capture({ src }) {
  const [state, set] = useState("idle"); const [email, setEmail] = useState("");
  async function go(e) { e.preventDefault(); set("busy");
    const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, src }) }).catch(() => null);
    set(r && r.ok ? "done" : (r && r.status === 503 ? "off" : "err")); }
  if (state === "done") return <p style={{ color: "#8f8" }}>Sent. Check your inbox for the printable Step 1 and your day-1 nudge.</p>;
  if (state === "off") return null; // provider not configured yet — hide quietly, template is already on the page
  return <form onSubmit={go} style={{ display: "flex", gap: 8, margin: "12px 0" }}>
    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #444", background: "#111", color: "#fff" }} />
    <button disabled={state === "busy"} style={{ padding: "12px 16px", borderRadius: 10, border: 0, background: "#fff", color: "#000", fontWeight: 700 }}>{state === "busy" ? "…" : "Email me Step 1"}</button>
    {state === "err" && <span style={{ color: "#f88", alignSelf: "center" }}>Try again</span>}
  </form>;
}
