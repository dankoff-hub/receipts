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
  const title = String(p.title || handle || "your work").replace(/https?:\/\/\S+/g, "").replace(/[^\w\s']/g, " ").replace(/\s+/g, " ").trim().slice(0, 72);
  const about = String(p.desc || "").replace(/https?:\/\/\S+/g, "").replace(/\$\d[\d.]*/g, "").replace(/\b(amazing|love)\b/gi, "").replace(/\s+/g, " ").trim();
  const detail = (about.split(/[.!?]/).map((s) => s.trim()).find((s) => s.length > 18) || title).slice(0, 90);
  const who = p.kind === "newsletter" ? "letter" : "channel";
  const questions = [
    `What made you start the ${who}?`,
    "Which day was the hardest to keep on camera?",
    "Do you keep a private log, or is the video the record?",
    "What should someone do on day 1 if they are starting from zero?",
    "Which week did it stop feeling like a challenge?",
  ];
  const q = questions[[...handle].reduce((n, ch) => n + ch.charCodeAt(0), 0) % questions.length];
  let text = `${title} — ${detail}. ${q}`.replace(/\s+/g, " ").trim();
  if (/https?:|www\.|\.com|\.app|\$|refund|guarantee|partner collab|free pack/i.test(text)) {
    text = `${title} — that framing is concrete. What made you start the ${who}?`;
  }
  text = text.slice(0, 220);
  let n = 2;
  const base = text;
  while (seen.has(text)) text = `${base.slice(0, 210)} (${n++})`.slice(0, 220);
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
  const noSocial = !hasIg(p) && !hasTt(p);
  const noPublicMail = !p.public_email;
  if (noSocial && (blocked(p) || (p.kind === "newsletter" && noPublicMail) || !p.latest_video)) {
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
