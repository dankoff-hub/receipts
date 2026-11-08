// Partner outreach drafts — one UNIQUE DM + email per prospect (never a shared template), written by the zero-cost LLM
// cascade from the prospect's own public title/description. Stored in content/partner-prospects.json → drafts.
// Hard rules enforced after generation: 50% / $14.50 terms, free pack offer, Step 1 free link, partner link, no banned words.
import fs from "node:fs";
import { chat, parseJSON, saveQuota, skillHint } from "../swarm/llm.mjs";
const styleHint = [skillHint("humanizer", 220), skillHint("social-reply-and-comment-writer", 220), skillHint("value-prop-statements", 180)].filter(Boolean).join(" ");
function localOpener(p) {
  const title = String(p.title || p.handle || "your work").replace(/https?:\/\/\S+/g, "").replace(/[^\w\s']/g, " ").replace(/\s+/g, " ").trim().slice(0, 72);
  const about = String(p.desc || "").replace(/https?:\/\/\S+/g, "").replace(/\$\d[\d.]*/g, "").replace(/\s+/g, " ").trim();
  const detail = (about.split(/[.!?]/).map(s => s.trim()).find(s => s.length > 12) || title).slice(0, 80);
  const who = p.kind === "newsletter" ? "letter" : "channel";
  return `${title} covers ${detail} in a way that is specific, not generic. What made you start the ${who}?`.replace(/\s+/g, " ").slice(0, 240);
}
const P = "content/partner-prospects.json", prog = JSON.parse(fs.readFileSync("content/partner-program.json", "utf8"));
const data = JSON.parse(fs.readFileSync(P, "utf8"));
const BAN = /guarantee|refund|money[- ]back|earn \$|make \$|per month|income|therapy|cure|risk[- ]free/i;
const code = h => h.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
const todo = Object.values(data.prospects).filter(p => p.status === "prospect" && (!p.drafts?.dm || !p.drafts?.short)).sort((a, b) => b.score - a.score).slice(0, Number(process.env.DRAFT_LIMIT || 12));
let n = 0;
for (const p of todo) {
  const c = code(p.handle), first = (p.title || p.handle).replace(/[^A-Za-z ]/g, " ").trim().split(/\s+/)[0] || "there";
  const prompt = `You write short, human partner outreach for "Receipts": a $29, 30-day proof system for people who were told they weren't ready ("keep the receipt, then make it irrelevant"). Step 1 is free at receiptspack.vercel.app/free.
Prospect: ${p.kind === "newsletter" ? "newsletter" : "YouTube channel"} "${p.title}" — about: "${(p.desc || "").slice(0, 280)}".
Write JSON {"dm": string, "email_subject": string, "email": string, "short": string, "dm_opener": string}.
dm_opener: 1-2 lines, a specific compliment drawn only from their title or about, plus one question. No link, no offer, no price, no URL. Unique to this prospect.
dm: max 480 chars, first sentence must reference something specific from their title/about (no flattery words like amazing/love), then: we send the full pack free first; partner link receiptspack.vercel.app/p/${c} pays 50% of every sale ($14.50), monthly by PayPal, no quota, no exclusivity; end with one short question. Sign "— Dan, Receipts".
short: max 220 chars, NO URL and no $ figures (used as a public YouTube comment or TikTok DM where links are filtered): one specific line about their content, then that we would like to send them our full 30-day proof pack free and talk about a partner link, and to look for "Receipts partners" or reply. Sign "— Dan". 
email: 3 short paragraphs, same facts plus "Terms: receiptspack.vercel.app/partners/terms", sign "Dan Rossi — Receipts". Vary sentence rhythm; do not reuse stock phrases like "I came across" or "I hope this finds you". Never promise income, never mention refunds or guarantees.`;
  const out = await chat(prompt, { system: "Output compact JSON only. " + styleHint, maxTokens: 700 }); const r = parseJSON(out.text);
  if (!r?.dm || !r?.email) { console.log("no draft for", p.handle, "provider", out.provider); continue; }
  r.dm = String(r.dm); r.email = String(r.email); p.drafts_provider = out.provider;
  r.short = String(r.short || "").trim();
  const ok = !BAN.test(r.dm + r.email + r.short) && r.dm.length <= 520 && r.dm.includes(`/p/${c}`) && /\$14\.50|50%/.test(r.dm) && r.short.length > 40 && r.short.length <= 260 && !/https?:|\.app|\.com|\$/.test(r.short);
  if (!ok) { console.log("draft rejected by rules:", p.handle); continue; }
  const openerRaw = String(r.dm_opener || "").trim();
  const openerOk = openerRaw && !BAN.test(openerRaw) && openerRaw.length <= 280 && !/https?:|www\.|\.app|\.com|\$|free pack|partner link/i.test(openerRaw);
  const opener = p.drafts?.dm_opener || (openerOk ? openerRaw : localOpener(p));
  if (BAN.test(opener)) { console.log("opener rejected by rules:", p.handle); continue; }
  p.drafts = { ...(p.drafts || {}), code: c, dm: p.drafts?.dm || r.dm.trim(), email_subject: p.drafts?.email_subject || String(r.email_subject || "A partner idea for your audience").slice(0, 90), email: p.drafts?.email || r.email.trim(), short: r.short, dm_opener: p.drafts?.dm_opener || opener, generated: new Date().toISOString() }; n++;
}
for (const p of Object.values(data.prospects)) {
  if (!p.drafts || p.drafts.dm_opener) continue;
  const opener = localOpener(p);
  if (!opener || BAN.test(opener) || /https?:|www\.|\.app|\.com|\$/.test(opener)) continue;
  p.drafts.dm_opener = opener;
}
data.updated = new Date().toISOString(); fs.writeFileSync(P, JSON.stringify(data, null, 1)); saveQuota();
console.log(`drafts written: ${n}`);
