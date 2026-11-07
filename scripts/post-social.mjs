#!/usr/bin/env node
// post-social — original posts on the founder-owned text platforms (Bluesky @danrossi2026.bsky.social, Mastodon @danrossi2026@mastodon.social).
// Founder directive 2026-11-07: "do posts and replies on other platforms as well. target is revenue."
// Slot a (08:00 UTC): a fresh text post written from today's newest swarm concept (never repeated: hash ledger). No link — reach.
// Slot c (16:00 UTC): today's photo (the one Instagram got) + its caption + the free-tracker link with a per-platform src tag — conversion.
// Zero cost: AT Protocol + Mastodon REST, free accounts, no card. Every post logged in content/post-log.json (channel bluesky|mastodon).
import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { chat, parseJSON, saveQuota, skillHint } from "../swarm/llm.mjs";
process.on("exit", () => saveQuota());

const slot = (process.argv.find(a => a.startsWith("--slot=")) || "--slot=a").slice(7);
const FORCE = process.argv.includes("--force");
const today = new Date().toISOString().slice(0, 10);
const LOG = "content/post-log.json", LEDGER = "content/caption-ledger.json";
const load = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };
const log = load(LOG, []), ledger = load(LEDGER, { used: [] }); ledger.social ??= [];
const md5 = s => crypto.createHash("md5").update(s).digest("hex");
const HANDLE = process.env.BLUESKY_HANDLE, APP_PW = process.env.BLUESKY_APP_PASSWORD, MTOK = process.env.MASTODON_TOKEN;
const kind = slot === "c" ? "photo" : slot === "a" ? "text" : null;
if (!kind) { console.log("post-social: nothing scheduled for slot", slot); process.exit(0); }
const already = ch => log.some(p => p.channel === ch && p.ts.slice(0, 10) === today && p.kind === kind && p.status === "sent");

// ---------- content ----------
let text, imagePath, alt, link;
if (kind === "photo") {
  const ig = [...log].reverse().find(p => p.channel === "instagram_photo" && p.status === "sent" && p.ts.slice(0, 10) === today);
  const caps = load("content/photo-captions.json", { captions: {} }).captions;
  if (!ig || !caps[ig.slug]) { console.log("post-social: no Instagram photo today yet — skipping"); process.exit(0); }
  imagePath = `public/photos/${ig.video}`; alt = `Photo: ${ig.slug.replace(/-/g, " ")}`;
  const cap = caps[ig.slug].replace(/#\w+/g, "").replace(/\n{3,}/g, "\n\n").trim();
  text = cap.length > 240 ? cap.slice(0, 237).replace(/\s+\S*$/, "") + "…" : cap;
  link = "receipts-blond.vercel.app/free";
} else {
  const C = load("swarm/CONCEPTS.json", { days: {} });
  const days = Object.keys(C.days).sort(); const pool = (C.days[days.at(-1)] || []).concat(C.days[days.at(-2)] || []);
  const seed = pool.find(c => !ledger.social.includes(md5("seed|" + c.id))) || pool[0];
  const hint = skillHint("social-hook-writer", 350);
  const r = await chat(`Write ONE original short text post (max 260 chars, 2-4 lines, plain text, no hashtags, no emojis, no links, no quotes) for Bluesky/Mastodon in the voice of Dan: a regular guy doing 30 days of "receipts" — one honest line a day proving the people who doubted him wrong. Calm, specific, a little dry. Base it on this idea but do not copy it: hook "${seed?.hook || "day one is the loudest day"}", lesson "${seed?.body || "nobody debates a streak"}". ${hint ? "Hook craft: " + hint.slice(0, 300) : ""} Return JSON {"post":"..."}.`, { system: "Output compact JSON only.", maxTokens: 220 });
  text = parseJSON(r.text)?.post?.trim();
  if (!text) text = `Day ${(new Date().getUTCDate() % 28) + 1}. ${seed?.hook || "Still here."}\n\nOne line in the notebook. No speech. The streak does the talking.`;
  text = text.replace(/https?:\/\/\S+/g, "").replace(/#\w+/g, "").trim();
  if (text.length > 290) text = text.slice(0, 287).replace(/\s+\S*$/, "") + "…";
  if (seed) ledger.social.push(md5("seed|" + seed.id));
}
const h = md5(text);
if (ledger.social.includes(h) && !FORCE) { console.log("post-social: text already posted once — refusing to repeat"); process.exit(0); }

// ---------- image prep (Bluesky blob limit ~1 MB) ----------
let imgBuf = null;
if (imagePath) {
  if (!fs.existsSync(imagePath)) { console.log("post-social: image missing", imagePath); process.exit(0); }
  const tmp = "/tmp/social-post.jpg";
  try { execSync(`python3 -c "from PIL import Image; im=Image.open('${imagePath}').convert('RGB'); im.thumbnail((1600,1600)); q=88\nimport os\nwhile True:\n    im.save('${tmp}',quality=q,optimize=True)\n    if os.path.getsize('${tmp}')<950000 or q<40: break\n    q-=8"`, { stdio: "ignore" }); imgBuf = fs.readFileSync(tmp); }
  catch { imgBuf = fs.readFileSync(imagePath); if (imgBuf.length > 999000) imgBuf = null; }
}

// ---------- senders ----------
async function bluesky() {
  if (!HANDLE || !APP_PW) return { status: "skipped", why: "no creds" };
  const s = await (await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: HANDLE, password: APP_PW }) })).json();
  if (!s.accessJwt) return { status: "failed", why: "login" };
  const auth = { authorization: "Bearer " + s.accessJwt };
  let body = text; const facets = [];
  if (link) { const shown = link; body = text + "\n\nFree 30-day tracker: " + shown; const b = Buffer.byteLength(body) - Buffer.byteLength(shown); facets.push({ index: { byteStart: b, byteEnd: b + Buffer.byteLength(shown) }, features: [{ $type: "app.bsky.richtext.facet#link", uri: "https://" + link + "?src=bsky" }] }); }
  const rec = { $type: "app.bsky.feed.post", text: body, createdAt: new Date().toISOString(), langs: ["en"], ...(facets.length ? { facets } : {}) };
  if (imgBuf) { const up = await (await fetch("https://bsky.social/xrpc/com.atproto.repo.uploadBlob", { method: "POST", headers: { ...auth, "content-type": "image/jpeg" }, body: imgBuf })).json(); if (up.blob) rec.embed = { $type: "app.bsky.embed.images", images: [{ alt, image: up.blob }] }; }
  const r = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", { method: "POST", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify({ repo: s.did, collection: "app.bsky.feed.post", record: rec }) });
  const j = await r.json(); if (!r.ok) return { status: "failed", why: JSON.stringify(j).slice(0, 160) };
  return { status: "sent", url: `https://bsky.app/profile/${HANDLE}/post/${j.uri.split("/").pop()}` };
}
async function mastodon() {
  if (!MTOK) return { status: "skipped", why: "no creds" };
  const auth = { authorization: "Bearer " + MTOK };
  let media_ids = [];
  if (imgBuf) {
    const fd = new FormData(); fd.append("file", new Blob([imgBuf], { type: "image/jpeg" }), "photo.jpg"); fd.append("description", alt);
    const up = await fetch("https://mastodon.social/api/v2/media", { method: "POST", headers: auth, body: fd }); const m = await up.json();
    if (m.id) { media_ids = [m.id]; for (let i = 0; i < 10 && up.status === 202; i++) { await new Promise(r => setTimeout(r, 3000)); const c = await fetch(`https://mastodon.social/api/v1/media/${m.id}`, { headers: auth }); if (c.status === 200) break; } }
  }
  const status = link ? text + "\n\nFree 30-day tracker: https://" + link + "?src=masto" : text;
  const r = await fetch("https://mastodon.social/api/v1/statuses", { method: "POST", headers: { ...auth, "content-type": "application/json", "Idempotency-Key": h + slot + today }, body: JSON.stringify({ status, media_ids, visibility: "public", language: "en" }) });
  const j = await r.json(); if (!r.ok) return { status: "failed", why: JSON.stringify(j).slice(0, 160) };
  return { status: "sent", url: j.url };
}

// ---------- run ----------
let sentAny = false;
for (const [ch, fn] of [["bluesky", bluesky], ["mastodon", mastodon]]) {
  if (already(ch) && !FORCE) { console.log(`post-social: ${ch} ${kind} already posted today`); continue; }
  let res; try { res = await fn(); } catch (e) { res = { status: "failed", why: e.message.slice(0, 160) }; }
  log.push({ ts: new Date().toISOString(), channel: ch, kind, status: res.status, url: res.url || null, why: res.why || null, captionHash: h, video: imagePath ? imagePath.split("/").pop() : null });
  console.log(`post-social: ${ch} ${kind} → ${res.status} ${res.url || res.why || ""}`);
  if (res.status === "sent") sentAny = true;
}
if (sentAny) ledger.social.push(h);
ledger.social = ledger.social.slice(-3000);
fs.writeFileSync(LOG, JSON.stringify(log, null, 1)); fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1));
