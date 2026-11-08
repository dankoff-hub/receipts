// Log a sent partner message + mark the prospect contacted. Usage: node scripts/partner-log.mjs <handle> <channel: ig|email|substack|yt> [to]
// Enforces cap_per_day (120) and cap_per_platform. Risky channels override lower: ig, yt, tiktok stay at 8. Substack stays at 0. Exits 2 when capped.
import fs from "node:fs"; import crypto from "node:crypto";
const [handle, channel, to = ""] = process.argv.slice(2);
const LP = "content/partner-outreach-log.json", PP = "content/partner-prospects.json";
const log = JSON.parse(fs.readFileSync(LP, "utf8")), data = JSON.parse(fs.readFileSync(PP, "utf8"));
const PLATFORM_CAP = log.cap_per_platform || 8, CHANNELS = ["ig", "email", "substack", "yt", "tiktok", "threads", "bluesky", "mastodon"];
const capFor = (c) => (log.cap_overrides && c in log.cap_overrides ? log.cap_overrides[c] : PLATFORM_CAP);
const today = new Date().toISOString().slice(0, 10), todays = log.sent.filter(s => s.date.startsWith(today)), sentToday = todays.length;
const perPlatform = Object.fromEntries(CHANNELS.map(c => [c, todays.filter(s => s.channel === c).length]));
if (process.argv.includes("--check")) { console.log(JSON.stringify({ today, sentToday, remaining: log.cap_per_day - sentToday, platform_remaining: Object.fromEntries(CHANNELS.map(c => [c, capFor(c) - perPlatform[c]])) })); process.exit(0); }
if (!CHANNELS.includes(channel)) { console.error("channel must be one of " + CHANNELS.join("|")); process.exit(1); }
if (perPlatform[channel] >= capFor(channel)) { console.error(`platform cap reached for ${channel}`); process.exit(2); }
if (sentToday >= log.cap_per_day) { console.error("daily cap reached"); process.exit(2); }
const p = data.prospects[handle]; if (!p) { console.error("unknown prospect", handle); process.exit(1); }
const txt = channel === "email" ? p.drafts?.email : p.drafts?.dm;
log.sent.push({ handle, channel, to, date: new Date().toISOString(), sha1: crypto.createHash("sha1").update(txt || "").digest("hex").slice(0, 12) });
p.status = "contacted"; p.contacted = today; p.contact_channel = channel;
fs.writeFileSync(LP, JSON.stringify(log, null, 1)); fs.writeFileSync(PP, JSON.stringify(data, null, 1));
console.log(`logged ${handle} via ${channel}; sent today: ${sentToday + 1}/${log.cap_per_day}`);
