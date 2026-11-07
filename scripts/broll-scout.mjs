#!/usr/bin/env node
// Weekly: refresh free b-roll + music pools from Mixkit (Mixkit License: free for commercial use, no attribution,
// https://mixkit.co/license/). No API key, no account. Writes content/broll-pool.json and content/music-pool.json.
// Vertical clips preferred (probe dimensions with ffprobe on the first ~600KB). Landscape 1080p kept as fallback (center-crop).
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36";
const THEMES = { // theme -> Mixkit category slugs
  city: ["city", "street", "traffic", "night-city"],
  nature: ["nature", "forest", "ocean", "mountain", "rain"],
  other: ["abstract", "space", "aerial", "gym", "office"],
};
const MOODS = ["ambient", "chill", "cinematic", "lo-fi", "inspirational", "calm"];
const get = async u => { try { const r = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow" }); return r.ok ? await r.text() : ""; } catch { return ""; } };
const head = async u => { try { const r = await fetch(u, { method: "HEAD", headers: { "User-Agent": UA } }); return r.ok ? +(r.headers.get("content-length") || 0) : 0; } catch { return 0; } };
async function probe(url) { // dimensions + duration from a partial download
  const tmp = `/tmp/probe-${Date.now()}.mp4`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Range: "bytes=0-800000" } }); if (!r.ok) return null;
    fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
    const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", tmp], { stdio: ["ignore", "pipe", "ignore"] }).toString();
    const j = JSON.parse(out); const s = (j.streams || [])[0] || {}; return { w: s.width, h: s.height, dur: +(j.format?.duration || 0) };
  } catch { return null; } finally { try { fs.unlinkSync(tmp); } catch {} }
}
const pool = { updated: new Date().toISOString(), source: "mixkit.co (Mixkit License, no attribution)", clips: [] };
const seen = new Set();
for (const [theme, slugs] of Object.entries(THEMES)) {
  for (const slug of slugs) {
    const html = await get(`https://mixkit.co/free-stock-video/${slug}/?orientation=vertical`);
    const cards = [...html.matchAll(/href="\/free-stock-video\/([a-z0-9-]+)-(\d+)\/"/g)].map(m => ({ slug: m[1], id: m[2] }));
    for (const c of cards.slice(0, 18)) {
      if (seen.has(c.id)) continue; seen.add(c.id);
      const u720 = `https://assets.mixkit.co/videos/${c.id}/${c.id}-720.mp4`;
      if (/scream|horror|scary|blood|zombie|skull|gun|war|crash|accident|sexy|bikini/.test(c.slug)) continue;
      const p = await probe(u720); if (!p || !p.w) continue;
      const vertical = p.h > p.w; if (!vertical && pool.clips.filter(x => x.theme === theme && !x.vertical).length >= 4) continue; // keep a few landscape as fallback
      const u1080 = `https://assets.mixkit.co/videos/${c.id}/${c.id}-1080.mp4`; const s1080 = await head(u1080);
      pool.clips.push({ id: c.id, theme, title: c.slug.replace(/-/g, " "), vertical, w: p.w, h: p.h, dur: p.dur, url720: u720, url1080: s1080 && s1080 < 95e6 ? u1080 : null, bytes1080: s1080 || null });
      if (pool.clips.filter(x => x.theme === theme).length >= 22) break;
    }
    if (pool.clips.filter(x => x.theme === theme).length >= 22) break;
  }
  console.log(theme, pool.clips.filter(x => x.theme === theme).length, "clips,", pool.clips.filter(x => x.theme === theme && x.vertical).length, "vertical");
}
fs.writeFileSync("content/broll-pool.json", JSON.stringify(pool, null, 1));
// music
const music = { updated: new Date().toISOString(), source: "mixkit.co (Mixkit License, no attribution)", tracks: [] }; const ms = new Set();
for (const mood of MOODS) {
  const html = await get(`https://mixkit.co/free-stock-music/tag/${mood}/`);
  const ids = [...html.matchAll(/assets\.mixkit\.co\/music\/(\d+)\/\1\.mp3/g)].map(m => m[1]);
  const titles = Object.fromEntries([...html.matchAll(/href="\/free-stock-music\/([a-z0-9-]+)-(\d+)\/"/g)].map(m => [m[2], m[1].replace(/-/g, " ")]));
  for (const id of [...new Set(ids)].slice(0, 10)) { if (ms.has(id)) continue; ms.add(id); music.tracks.push({ id, mood, title: titles[id] || null, url: `https://assets.mixkit.co/music/${id}/${id}.mp3` }); }
  console.log("music", mood, [...new Set(ids)].length);
}
fs.writeFileSync("content/music-pool.json", JSON.stringify(music, null, 1));
console.log("pool:", pool.clips.length, "clips;", music.tracks.length, "tracks");
