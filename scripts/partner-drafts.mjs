// Partner outreach drafts — one UNIQUE DM + email per prospect (never a shared template), written by the zero-cost LLM
// cascade from the prospect's own public title/description. Stored in content/partner-prospects.json → drafts.
// Hard rules enforced after generation: 50% / $14.50 terms, free pack offer, Step 1 free link, partner link, no banned words.
import fs from "node:fs";
import { chat, parseJSON, saveQuota } from "../swarm/llm.mjs";
const P = "content/partner-prospects.json", prog = JSON.parse(fs.readFileSync("content/partner-program.json", "utf8"));
const data = JSON.parse(fs.readFileSync(P, "utf8"));
const BAN = /guarantee|refund|money[- ]back|earn \$|make \$|per month|income|therapy|cure|risk[- ]free/i;
const code = h => h.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
const todo = Object.values(data.prospects).filter(p => p.status === "prospect" && !p.drafts?.dm).sort((a, b) => b.score - a.score).slice(0, Number(process.env.DRAFT_LIMIT || 12));
let n = 0;
for (const p of todo) {
  const c = code(p.handle), first = (p.title || p.handle).replace(/[^A-Za-z ]/g, " ").trim().split(/\s+/)[0] || "there";
  const prompt = `You write short, human partner outreach for "Receipts": a $29, 30-day proof system for people who were told they weren't ready ("keep the receipt, then make it irrelevant"). Step 1 is free at receiptspack.vercel.app/free.
Prospect: ${p.kind === "newsletter" ? "newsletter" : "YouTube channel"} "${p.title}" — about: "${(p.desc || "").slice(0, 280)}".
Write JSON {"dm": string, "email_subject": string, "email": string}.
dm: max 480 chars, first sentence must reference something specific from their title/about (no flattery words like amazing/love), then: we send the full pack free first; partner link receiptspack.vercel.app/p/${c} pays 50% of every sale ($14.50), monthly by PayPal, no quota, no exclusivity; end with one short question. Sign "— Dan, Receipts".
email: 3 short paragraphs, same facts plus "Terms: receiptspack.vercel.app/partners/terms", sign "Dan Rossi — Receipts". Vary sentence rhythm; do not reuse stock phrases like "I came across" or "I hope this finds you". Never promise income, never mention refunds or guarantees.`;
  const r = parseJSON(await chat(prompt, { system: "Output compact JSON only.", maxTokens: 700 }));
  if (!r?.dm || !r?.email) { console.log("no draft for", p.handle); continue; }
  const ok = !BAN.test(r.dm + r.email) && r.dm.length <= 520 && r.dm.includes(`/p/${c}`) && /\$14\.50|50%/.test(r.dm);
  if (!ok) { console.log("draft rejected by rules:", p.handle); continue; }
  p.drafts = { code: c, dm: r.dm.trim(), email_subject: String(r.email_subject || "A partner idea for your audience").slice(0, 90), email: r.email.trim(), generated: new Date().toISOString() }; n++;
}
data.updated = new Date().toISOString(); fs.writeFileSync(P, JSON.stringify(data, null, 1)); saveQuota();
console.log(`drafts written: ${n}`);
