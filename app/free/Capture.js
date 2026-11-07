"use client";
import { useState } from "react";
export default function Capture({ src }) {
  const [state, set] = useState("idle"); const [email, setEmail] = useState("");
  async function go(e) { e.preventDefault(); set("busy");
    const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, src }) }).catch(() => null);
    let j = {}; try { j = r ? await r.json() : {}; } catch {}
    set(r && r.ok ? (j.sends ? "done" : "stored") : (r && r.status === 503 ? "off" : "err")); }
  if (state === "stored") return <p style={{ color: "#8f8" }}>Saved, thank you. The printable sheet is linked above and is yours now; the day-1 reminder goes out as soon as reminders are switched on.</p>;
  if (state === "done") return <p style={{ color: "#8f8" }}>Saved. You will get one reminder on day 1 — nothing else. The printable sheet is linked above; no need to wait for an email.</p>;
  if (state === "off") return null; // provider not configured yet — hide quietly, template is already on the page
  return <form onSubmit={go} style={{ display: "flex", gap: 8, margin: "12px 0" }}>
    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #444", background: "#111", color: "#fff" }} />
    <button disabled={state === "busy"} style={{ padding: "12px 16px", borderRadius: 10, border: 0, background: "#fff", color: "#000", fontWeight: 700, whiteSpace: "nowrap" }}>{state === "busy" ? "…" : "Remind me"}</button>
    {state === "err" && <span style={{ color: "#f88", alignSelf: "center" }}>Try again</span>}
  </form>;
}
