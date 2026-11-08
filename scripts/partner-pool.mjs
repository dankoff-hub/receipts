// Refill the partner send pool. Edits content/partner-prospects.json only.
// Never sends DMs, email, or comments.
import fs from "node:fs";

const P = "content/partner-prospects.json";
const data = JSON.parse(fs.readFileSync(P, "utf8"));
const prospects = data.prospects || {};

const hasIg = (p) => /instagram\.com/i.test([p.ig, ...(p.links || [])].filter(Boolean).join(" "));
const hasTt = (p) => /tiktok\.com/i.test([p.tt, ...(p.links || [])].filter(Boolean).join(" "));
const blocked = (p) => p.substack_blocked === true || (typeof p.substack_blocked === "string" && p.substack_blocked.length > 0);

const seen = new Set();
function openerFor(p) {
  const handle = String(p.handle || "").replace(/^@/, "").trim();
  const title = String(p.title || handle || "your work").replace(/\s+/g, " ").trim();
  const desc = String(p.desc || "").replace(/\b(amazing|love)\b/gi, "").replace(/\s+/g, " ").trim();
  const token = (handle || title.split(/\s+/)[0] || "you").replace(/[^\w.-]/g, "");
  let specific = (desc.length > 28 ? desc : title).replace(/https?:\/\/\S+/gi, "").replace(/\b[\w.-]+\.(com|app|io|ee)\b/gi, "").trim();
  specific = specific.split(/[.!?]/)[0].trim();
  if (!specific.toLowerCase().includes(token.toLowerCase().slice(0, Math.min(6, token.length)))) {
    specific = `${title} (${token}) — ${specific}`;
  }
  const q = "do you take partner collabs?";
  let text = `${specific} ${q}`.replace(/\s+/g, " ").trim();
  if (text.length > 180) {
    const budget = 180 - q.length - 1;
    text = `${specific.slice(0, budget).replace(/\s+\S*$/, "").trim()} ${q}`;
  }
  if (text.length > 180) text = text.slice(0, 180).trim();
  if (/https?:|receipts|\$\d|pack link/i.test(text)) text = `${title} (${token}) — ${q}`.slice(0, 180);
  let n = 2;
  const base = text;
  while (seen.has(text)) text = `${base.slice(0, 176)} ${n++}`.slice(0, 180);
  seen.add(text);
  return text;
}

let openers_added = 0;
let already_had_opener = 0;
let route_exhausted = 0;

for (const p of Object.values(prospects)) {
  if (p.drafts?.dm_opener) already_had_opener++;
  if (p.status !== "prospect") continue;
  if (hasIg(p) && !p.drafts?.dm_opener) {
    p.drafts = { ...(p.drafts || {}), dm_opener: openerFor(p) };
    openers_added++;
  }
  if (!hasIg(p) && blocked(p) && !hasTt(p)) {
    if (!p.route_exhausted) route_exhausted++;
    p.route_exhausted = true;
  }
}

const still_sendable = Object.values(prospects).filter((p) => {
  const d = p.drafts || {};
  return (d.dm_opener || d.short) && !p.route_exhausted;
}).length;

fs.writeFileSync(P, JSON.stringify(data, null, 1) + "\n");
console.log(JSON.stringify({ openers_added, already_had_opener, route_exhausted, still_sendable }));
