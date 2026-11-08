"use client";
import { useMemo, useState } from "react";
import { C, btn, card, input } from "../theme";

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 140);

export default function Maker({ initial = "" }) {
  const [line, setLine] = useState(clean(initial) || "You are not ready.");
  const shown = clean(line) || "You are not ready.";
  const share = useMemo(() => {
    const q = new URLSearchParams({ line: shown, src: "card" });
    return "https://receiptspack.vercel.app/card?" + q.toString();
  }, [shown]);
  const og = "/card/og?line=" + encodeURIComponent(shown);

  return (
    <div>
      <label style={{ display: "block", fontSize: 14, color: C.muted, marginBottom: 6 }}>What was said. Once. Privately shareable.</label>
      <input value={line} onChange={(e) => setLine(e.target.value)} maxLength={140} style={input} aria-label="The line they said" />
      <div style={{ ...card, marginTop: 16, background: "#17161A", color: "#F6F1E8", borderColor: "#17161A" }}>
        <div style={{ letterSpacing: 3, fontSize: 11, color: "#C77A00", fontWeight: 700 }}>RECEIPT · DAY 0</div>
        <p style={{ fontFamily: "var(--font-head), Georgia, serif", fontSize: 28, lineHeight: 1.2, margin: "12px 0" }}>“{shown}”</p>
        <p style={{ color: "#E3DBCD", margin: 0 }}>Kept. Not answered. 30 days to make it irrelevant.</p>
        <img alt="" src={og} width={640} height={360} style={{ width: "100%", height: "auto", borderRadius: 10, marginTop: 14, display: "block" }} />
      </div>
      <p style={{ fontSize: 14, color: C.muted }}>Share this card. The full system starts with the free template. No sign-up on this page.</p>
      <p>
        <a href={"/free?src=card"} style={btn}>Start with the free template</a>
      </p>
      <p style={{ fontSize: 13, wordBreak: "break-all" }}><a href={share}>{share}</a></p>
    </div>
  );
}
