#!/usr/bin/env node
// Tag scout (agent 3 of the swarm): refreshes trending hashtag sets daily.
// Sources: best-hashtags.com (free, no auth) per seed keyword; TikTok Creative
// Center has no open endpoint, so TikTok set = trending tags + proven TikTok tags.
// Output: content/tags.json consumed by scripts/make-video.py on the same morning.
import fs from "node:fs";

const SEEDS = ["motivation", "selfimprovement", "discipline", "provethemwrong", "mindset"];
const CORE = ["provethemwrong", "receipts", "30daychallenge"]; // always-on brand tags
const TIKTOK_BASE = ["fyp", "careertok", "motivationtiktok", "discipline"]; // proven TikTok surfaces
const NOISE = /^(f|ff|l|d|fff|color|pic|insta|instagram|explorepage|explore|instagood|love|reels)$/;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function tagsFor(seed) {
  try {
    let r = await fetch(`https://best-hashtags.com/hashtag/${seed}/`, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) { await sleep(3000); r = await fetch(`https://best-hashtags.com/hashtag/${seed}/`, { headers: { "User-Agent": "Mozilla/5.0" } }); }
    if (!r.ok) { console.log(`  seed ${seed}: HTTP ${r.status}`); return []; }
    const html = await r.text();
    const tags = [...new Set([...html.matchAll(/#([a-z][a-z0-9]{2,20})\b/gi)].map(m => m[1].toLowerCase()))]
      .filter(t => !/^[0-9a-f]{6}(_\d+)?$/.test(t) || /[g-z]/.test(t))  // strip color hex noise only
      .filter(t => !NOISE.test(t));
    console.log(`  seed ${seed}: ${tags.length} tags`);
    return tags.slice(0, 15);
  } catch (e) { console.log(`  seed ${seed}: ERROR ${e.message}`); return []; }
}

const buckets = {};
for (const s of SEEDS) { buckets[s] = await tagsFor(s); await sleep(1500); }
const hit = Object.values(buckets).filter(b => b.length > 3).length;
console.log(`TAG SCOUT: ${hit}/${SEEDS.length} seeds returned data`);

// Build 4 daily mixes: core tags + interleaved trending tags, so make-video rotates fresh sets.
const pool = [];
const lists = Object.values(buckets).filter(b => b.length);
for (let i = 0; pool.length < 40 && lists.some(l => l.length); i++)
  for (const l of lists) if (l[i]) pool.push(l[i]);
const uniq = [...new Set(pool)].filter(t => !CORE.includes(t));
const mixes = [];
for (let m = 0; m < 4; m++) {
  const pick = uniq.filter((_, i) => i % 4 === m).slice(0, 4);
  mixes.push({ instagram: [...CORE, ...pick], tiktok: [...CORE, ...TIKTOK_BASE.slice(0, 2), ...pick].slice(0, 7) });
}
const out = {
  at: new Date().toISOString(),
  ok: hit > 0,
  mixes: hit > 0 ? mixes : null,
  fallback: {
    instagram: [...CORE, "selfimprovement", "motivation", "discipline", "mindset"],
    tiktok: [...CORE, "fyp", "careertok", "motivationtiktok", "selfimprovement"],
  },
};
fs.mkdirSync("content", { recursive: true });
fs.writeFileSync("content/tags.json", JSON.stringify(out, null, 2));
console.log(hit > 0 ? `TAG SCOUT: wrote ${mixes.length} fresh mixes (${uniq.length} trending tags pooled)` : "TAG SCOUT: all sources failed — video generator will use fallback tags");
