"use client";
import { useState } from "react";
import { C, input, form } from "../theme";
export default function Capture({ src }) {
  const [state, set] = useState("idle"); const [email, setEmail] = useState("");
  async function go(e) { e.preventDefault(); set("busy");
    const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, src }) }).catch(() => null);
    let j = {}; try { j = r ? await r.json() : {}; } catch {}
    set(r && r.ok ? (j.sends ? "done" : "stored") : (r && r.status === 503 ? "off" : "err")); }
  if (state === "stored") return <p style={{ color: C.success, fontWeight: 600 }}>Saved, thank you. The printable sheet is linked above and is yours now; the day-1 reminder goes out as soon as reminders are switched on.</p>;
  if (state === "done") return <p style={{ color: C.success, fontWeight: 600 }}>Saved. You will get one reminder on day 1 — nothing else. The printable sheet is linked above; no need to wait for an email.</p>;
  if (state === "off") return null; // provider not configured yet — hide quietly, template is already on the page
  return <form onSubmit={go} style={form}>
    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={input} />
    <button disabled={state === "busy"} style={{ padding: "13px 16px", borderRadius: 10, border: 0, minHeight: 46, background: C.primary, color: C.primaryInk, fontWeight: 700, cursor: "pointer", fontSize: 15, whiteSpace: "nowrap" }}>{state === "busy" ? "…" : "Remind me"}</button>
    {state === "err" && <span style={{ color: C.danger }}>Something went wrong — try again.</span>}
  </form>;
}
