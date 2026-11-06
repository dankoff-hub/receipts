#!/usr/bin/env node
// Publish driver: for each channel, posts the OLDEST video that channel has not received yet.
// - at most 1 post per channel per run (so the two daily slots are spaced out)
// - hard caps per UTC day: TikTok 2, Instagram 4, YouTube 4 (counts avatar posts too)
// - a missed/cancelled run self-heals: unposted videos stay pending and go out next slot
// - a video that failed twice on a channel is skipped (no retry loops)
// Usage: node scripts/publish-pending.mjs
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const CAPS = { tiktok: 2, instagram: 4, youtube: 4 }; // Buffer free accepts ~1-2 TikTok videos/day; IG/YT have no such limit
const LOG = "content/post-log.json";
const load = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };
const today = new Date().toISOString().slice(0, 10);
const SCRIPTS = { tiktok: "scripts/publish-buffer.mjs", instagram: "scripts/cross-post-instagram.mjs", youtube: "scripts/cross-post-youtube.mjs" };

const videos = fs.readdirSync("public/videos").filter(f => f.endsWith(".mp4") && fs.existsSync(`public/videos/${f}.json`))
  .sort((a, b) => a.localeCompare(b)) // day-003 < day-003b < day-004;

const cfg = load("content/audience-config.json", {});
let failures = 0;
const ONLY = (process.env.ONLY_CHANNELS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
for (const channel of Object.keys(SCRIPTS)) {
  if (ONLY.length && !ONLY.includes(channel)) { console.log(`${channel}: not in ONLY_CHANNELS`); continue; }
  const pause = cfg.paused?.[channel];
  if (pause?.until && new Date(pause.until) > new Date()) { console.log(`${channel}: paused until ${pause.until} — ${pause.reason || ""}`); continue; }
  const log = load(LOG, []);
  const mine = log.filter(p => p.channel === channel);
  const countToday = mine.filter(p => p.ts?.slice(0, 10) === today && p.status !== "failed" && p.status !== "skipped").length;
  const DAILY_CAP = CAPS[channel] ?? 2;
  if (countToday >= DAILY_CAP) { console.log(`${channel}: daily cap reached (${countToday}/${DAILY_CAP}) — nothing to post`); continue; }
  const pending = videos.find(v => {
    const entries = mine.filter(p => p.video === v);
    if (entries.some(p => p.status !== "failed")) return false;      // posted, queued or intentionally skipped
    return entries.length < 2;                                          // failed < 2 times
  });
  if (!pending) { console.log(`${channel}: no pending video`); continue; }
  const file = `public/videos/${pending}`;
  const meta = load(file + ".json", {});
  if (!meta.captions) { // make sure every channel gets its own unique caption
    const c = spawnSync("node", ["scripts/caption-studio.mjs", file], { stdio: "inherit" });
    if (c.status !== 0) console.log("caption-studio failed for", pending);
  }
  console.log(`${channel}: posting ${pending}`);
  const r = spawnSync("node", [SCRIPTS[channel], file], { stdio: "inherit", env: process.env });
  if (r.status !== 0) { failures++; console.log(`${channel}: publish exited ${r.status}`); }
}
process.exit(0); // never fail the workflow on a single channel; failures are logged and retried next slot
