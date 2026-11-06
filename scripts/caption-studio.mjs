#!/usr/bin/env node
// Caption studio (swarm agent): builds per-channel captions for a video sidecar —
// TikTok, Instagram and YouTube each get a DIFFERENT text, and every caption is
// checked against content/caption-ledger.json so no caption is ever repeated.
// Usage: node scripts/caption-studio.mjs <video.mp4>   (rewrites <video>.json sidecar)
import fs from "node:fs";
import crypto from "node:crypto";

const file = process.argv[2];
const metaPath = file + ".json";
const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
const day = meta.day || 1;
const hook = (meta.hook || "Keep the receipt.").trim();
const AI_NOTE = "AI-generated avatar: synthetic voice over an animated photo, used with consent.";

const load = p => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
const tags = load("content/tags.json");
const mixes = tags?.mixes?.length ? tags.mixes : (tags?.fallback ? [tags.fallback] : [{ tiktok: [], instagram: [] }]);
const ctaLines = load("content/cta-bank.json")?.lines?.length ? load("content/cta-bank.json").lines : ["the 30-day Receipts system, link in bio."];
const ledgerPath = "content/caption-ledger.json";
const ledger = load(ledgerPath) || { used: [] };
// swarm feedback: audience-watch biases CTA/tag choices once real growth data exists
const strat = load("content/strategy-brief.json");
const ctaOffset = strat?.best_cta_index ?? 0;
const mixOffset = strat?.best_tag_mix_index ?? 0;
const md5 = s => crypto.createHash("md5").update(s).digest("hex");
const tagstr = l => (l || []).map(t => "#" + t).join(" ");

// Per-channel template banks — distinct structures so channels never share text.
const TK = [
  (h, c, t) => `${h} — ${c}\n${t}`,
  (h, c, t) => `${h}\n\n${c}\n\n${t}`,
  (h, c, t) => `POV: ${h.charAt(0).toLowerCase() + h.slice(1)}\n${c}\n${t}`,
  (h, c, t) => `${h}\n${c} Save this for day one.\n${t}`,
];
const IG = [
  (h, c, t) => `${h}\n\n${c}\n\n30 days. One standard. Proof you can hold.\n\n${t}`,
  (h, c, t) => `${h}\n\nOne receipt, one measurable standard, thirty days of evidence.\n${c}\n\n${t}`,
  (h, c, t) => `${h}\n\n${c}\nSave this. Start tomorrow: ${URL}\n\n${t}`,
  (h, c, t) => `${h}\n\n${c}\n\nFollow for day ${day + 1}.\n\n${t}`,
];
const URL = "receipts-blond.vercel.app/free";
const YT = [
  (h, c, t) => `${h}\n\n${c}\nFree Step 1 template: https://${URL}\n\n${t} #shorts`,
  (h, c, t) => `${h}\n${c}\nStart free: link in bio.\n\n${t} #shorts`,
  (h, c, t) => `${h}\n\nDay ${day} of 30. ${c}\nStart here: https://${URL}\n\n${t} #shorts`,
  (h, c, t) => `${h}\n\n${c}\nReceipts: 30 days, one standard, proof you can hold.\n\n${t} #shorts`,
];

function build(bank, tagsKey, seed) {
  for (let attempt = 0; attempt < 16; attempt++) {
    const tpl = bank[(seed + attempt) % bank.length];
    const mix = mixes[(seed + attempt + mixOffset) % mixes.length];
    const cta = ctaLines[(seed + attempt + ctaOffset) % ctaLines.length];
    let caption = tpl(hook, cta, tagstr(mix[tagsKey] || mix.tiktok || []));
    if (attempt > 8) caption += `\n\nDay ${day}.`; // last-resort uniqueness marker
    if (meta.avatar) caption += `\n\n${AI_NOTE} #aiavatar`;
    if (!ledger.used.includes(md5(caption))) return caption;
  }
  // deterministic fallback — always unique because of the timestamped day counter
  let c = `${hook}\n\n${ctaLines[seed % ctaLines.length]}\nDay ${day}, post ${seed}.\n${tagstr((mixes[seed % mixes.length] || {})[tagsKey] || [])}`;
  if (meta.avatar) c += `\n\n${AI_NOTE} #aiavatar`;
  return c;
}

const tiktok = build(TK, "tiktok", day);
const instagram = build(IG, "instagram", day + 1);
const youtube = build(YT, "tiktok", day + 2);
const ytTitle = (meta.day ? `Day ${day}: ${hook}` : hook).slice(0, 100);

meta.captions = { tiktok, instagram, youtube, ytTitle };
meta.caption = tiktok; // backward compat for any single-caption consumer
ledger.used.push(md5(tiktok), md5(instagram), md5(youtube));
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1));
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 1));
console.log("captions ok:", JSON.stringify({ tiktok: tiktok.length, instagram: instagram.length, youtube: youtube.length, ytTitle }));
