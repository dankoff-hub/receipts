"use client";
import { useState } from "react";
import { C, input, form } from "../theme";
const btn = { padding: "13px 16px", borderRadius: 10, border: 0, minHeight: 46, background: C.primary, color: C.primaryInk, fontWeight: 700, cursor: "pointer", fontSize: 16 };
export default function Apply() {
  const [s, set] = useState("idle"); const [v, setV] = useState({ name: "", email: "", platform: "YouTube", handle: "", audience: "1k-10k", note: "" });
  const u = k => e => setV({ ...v, [k]: e.target.value });
  async function go(e) { e.preventDefault(); set("busy");
    const r = await fetch("/api/partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) }).catch(() => null);
    set(r && r.ok ? "done" : (r && r.status === 503 ? "off" : "err")); }
  if (s === "done") return <p style={{ color: C.success, fontWeight: 600 }}>Received. You will hear back within 3 days with your link, the free pack and the one-page terms.</p>;
  if (s === "off") return <p style={{ color: C.body }}>Applications open shortly. Meanwhile, email <a href="mailto:tryuderzhi@gmail.com" style={{ color: C.primary }}>tryuderzhi@gmail.com</a> with your channel link.</p>;
  return <form onSubmit={go} style={form} aria-label="Partner application">
    <input required placeholder="Your name" value={v.name} onChange={u("name")} style={input} />
    <input type="email" required placeholder="you@example.com" value={v.email} onChange={u("email")} style={input} />
    <select value={v.platform} onChange={u("platform")} style={input} aria-label="Main platform">{["YouTube", "Instagram", "TikTok", "Newsletter", "Podcast", "Community", "Other"].map(p => <option key={p}>{p}</option>)}</select>
    <input required placeholder="Channel or newsletter link" value={v.handle} onChange={u("handle")} style={input} />
    <select value={v.audience} onChange={u("audience")} style={input} aria-label="Audience size">{["under 1k", "1k-10k", "10k-50k", "50k-200k", "200k+"].map(p => <option key={p}>{p}</option>)}</select>
    <textarea placeholder="Who is your audience and why would Receipts fit? (2 lines)" value={v.note} onChange={u("note")} style={{ ...input, minHeight: 72, fontFamily: "inherit" }} />
    <button disabled={s === "busy"} style={btn}>{s === "busy" ? "Sending…" : "Apply to partner"}</button>
    {s === "err" && <span style={{ color: C.danger }}>Something went wrong — try again or email tryuderzhi@gmail.com.</span>}
  </form>;
}
