#!/usr/bin/env node
// Agent 5 - CTA LAB: rotates conversion lines in captions; consults the survival verdict
// to raise urgency framing when the swarm is AT RISK. Writes content/cta-bank.json.
import fs from "node:fs";

const base = [
  "The 30-day Receipts system — $29, link in bio.",
  "30 days. One standard. Undeniable proof. $29, link in bio.",
  "Your receipt is waiting. $29 once, proof forever — link in bio.",
  "Stop collecting motivation. Start collecting proof. $29, link in bio.",
  "They'll see it in 30 days. You start today. $29 — link in bio.",
  "One purchase. Thirty days. No excuses left. $29, link in bio.",
];
const risk = [
  "Every day without a standard is a day they were right. $29 — link in bio.",
  "The 30 days will pass anyway. Own them. $29, link in bio.",
];
let mode = "base";
try {
  // consult the survival agent's latest brief verdict (embedded in repo state if present)
  const s = fs.readFileSync("content/virality-output.json", "utf8");
  if (/AT RISK/i.test(s)) mode = "risk";
} catch {}
const lines = mode === "risk" ? [...base.slice(0, 3), ...risk] : base;
fs.writeFileSync("content/cta-bank.json", JSON.stringify({ at: new Date().toISOString(), mode, lines }, null, 2));
console.log(`CTA LAB: ${lines.length} lines active (${mode} mode)`);
