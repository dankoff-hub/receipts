// Log a sent partner message + mark the prospect contacted. Usage: node scripts/partner-log.mjs <handle> <channel: ig|email|substack|yt> [to]
// Enforces the daily cap (20) across channels; exits 2 if the cap is reached so the sender stops.
import fs from "node:fs"; import crypto from "node:crypto";
const [handle, channel, to = ""] = process.argv.slice(2);
const LP = "content/partner-outreach-log.json", PP = "content/partner-prospects.json";
const log = JSON.parse(fs.readFileSync(LP, "utf8")), data = JSON.parse(fs.readFileSync(PP, "utf8"));
const today = new Date().toISOString().slice(0, 10), sentToday = log.sent.filter(s => s.date.startsWith(today)).length;
if (process.argv.includes("--check")) { console.log(JSON.stringify({ today, sentToday, remaining: log.cap_per_day - sentToday })); process.exit(0); }
if (sentToday >= log.cap_per_day) { console.error("daily cap reached"); process.exit(2); }
const p = data.prospects[handle]; if (!p) { console.error("unknown prospect", handle); process.exit(1); }
const txt = channel === "email" ? p.drafts?.email : p.drafts?.dm;
log.sent.push({ handle, channel, to, date: new Date().toISOString(), sha1: crypto.createHash("sha1").update(txt || "").digest("hex").slice(0, 12) });
p.status = "contacted"; p.contacted = today; p.contact_channel = channel;
fs.writeFileSync(LP, JSON.stringify(log, null, 1)); fs.writeFileSync(PP, JSON.stringify(data, null, 1));
console.log(`logged ${handle} via ${channel}; sent today: ${sentToday + 1}/${log.cap_per_day}`);
