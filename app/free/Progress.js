"use client";
import { useEffect, useState } from "react";
// Endowed progress (Nunes & Drèze 2006): the visitor is already on Step 1 of 5 — show it, let them tick it, and the next step
// is a continuation, not a cold purchase decision. State lives in localStorage only (nothing is sent anywhere).
const KEY = "receipts.step1";
export function Bar() {
  const [done, setDone] = useState(false);
  useEffect(() => { const read = () => { try { setDone(localStorage.getItem(KEY) === "1"); } catch {} }; read(); window.addEventListener("storage", read); return () => window.removeEventListener("storage", read); }, []);
  const pct = done ? 20 : 8;
  return <div style={{ margin: "0 0 18px 0" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#aaa", marginBottom: 6 }}>
      <span>Step 1 of 5 · {done ? "done" : "in progress"}</span><span>{pct}% of the system</span></div>
    <div style={{ height: 8, background: "#222", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: pct + "%", height: "100%", background: "#f2c94c", transition: "width .6s" }} /></div>
  </div>;
}
export function Tick({ pay }) {
  const [done, setDone] = useState(false);
  useEffect(() => { try { setDone(localStorage.getItem(KEY) === "1"); } catch {} }, []);
  function mark() { try { localStorage.setItem(KEY, "1"); } catch {} setDone(true); window.dispatchEvent(new Event("storage")); }
  if (!done) return <button onClick={mark} style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: "1px solid #f2c94c", background: "transparent", color: "#f2c94c", fontWeight: 700, fontSize: 16, cursor: "pointer", margin: "14px 0 4px 0" }}>
    I wrote my receipt ✓</button>;
  return <div style={{ background: "#1a1a10", border: "1px solid #f2c94c55", borderRadius: 12, padding: 16, margin: "14px 0 4px 0" }}>
    <b style={{ color: "#f2c94c" }}>Step 1 done. That is the part most people never do.</b>
    <p style={{ color: "#ccc", margin: "8px 0 12px 0" }}>Steps 2–5 turn your answer to question 4 into one measurable standard and 30 days of logged proof. You are 20% in; the pack is the other 80%.</p>
    <a href={pay} style={{ display: "block", padding: "14px 18px", background: "#fff", color: "#000", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 17, textAlign: "center" }}>Continue to Step 2 — $29, one-time</a>
  </div>;
}
