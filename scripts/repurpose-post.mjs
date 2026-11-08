#!/usr/bin/env node
// Content repurposing bot. One guide becomes two unique posts (Bluesky + Mastodon).
// No LLM. No card. Does not repeat a hash. Does not touch the partner cap.
import fs from "node:fs";
import crypto from "node:crypto";

const today = new Date().toISOString().slice(0, 10);
const LOG = "content/post-log.json";
const log = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, "utf8")) : [];
const pages = JSON.parse(fs.readFileSync("content/seo-pages.json", "utf8")).pages || {};
const mechanism = JSON.parse(fs.readFileSync("content/product-mechanism.json", "utf8"));
const list = Object.values(pages);
if (!list.length) { console.log("repurpose: no guides yet"); process.exit(0); }
const used = new Set(log.filter(p => p.status === "sent" && p.captionHash).map(p => p.captionHash));
const dayNum = Number(today.slice(8, 10));
const arg = process.argv.find(a => a.startsWith("--pick="));
const page = arg ? (pages[arg.slice(7)] || list[dayNum % list.length]) : list[dayNum % list.length];
const BAN = /guarantee|refund|money-back|earn \$|make \$|income|therapy|cure/i;

function graphemes(s) { return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(s)].map((x) => x.segment); }
function capGraphemes(s, max) {
  const g = graphemes(s);
  if (g.length <= max) return s;
  return g.slice(0, max).join("").replace(/\s+\S*$/, "").trim();
}
function variant(channel) {
  const link = `receiptspack.vercel.app/free?src=${channel}-repurpose`;
  const tail = `Free template: ${link}`;
  const max = channel === "bluesky" ? 300 : 480;
  const room = max - graphemes(tail).length - 2;
  const lines = mechanism.post_lines || [];
  const line = lines[(dayNum + (channel === "bluesky" ? 0 : 5)) % lines.length] || mechanism.if_then;
  const a = `${line} ${page.h1}.`;
  const b = `${page.h1}. ${line} ${page.paragraphs[0] || page.description}`;
  const body = capGraphemes(channel === "bluesky" ? a : b, room);
  return `${body}\n\n${tail}`;
}

async function bluesky(text) {
  const HANDLE = process.env.BLUESKY_HANDLE, APP_PW = process.env.BLUESKY_APP_PASSWORD;
  if (!HANDLE || !APP_PW) return { status: "skipped", why: "no creds" };
  const s = await (await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: HANDLE, password: APP_PW }) })).json();
  if (!s.accessJwt) return { status: "failed", why: "login" };
  const shown = text.match(/receiptspack\.vercel\.app\/\S+/)?.[0];
  const facets = [];
  if (shown) {
    const b = Buffer.byteLength(text) - Buffer.byteLength(shown);
    facets.push({ index: { byteStart: b, byteEnd: b + Buffer.byteLength(shown) }, features: [{ $type: "app.bsky.richtext.facet#link", uri: "https://" + shown }] });
  }
  const rec = { $type: "app.bsky.feed.post", text, createdAt: new Date().toISOString(), langs: ["en"], ...(facets.length ? { facets } : {}) };
  const r = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", { method: "POST", headers: { authorization: "Bearer " + s.accessJwt, "content-type": "application/json" }, body: JSON.stringify({ repo: s.did, collection: "app.bsky.feed.post", record: rec }) });
  const j = await r.json();
  if (!r.ok) return { status: "failed", why: JSON.stringify(j).slice(0, 160) };
  return { status: "sent", url: `https://bsky.app/profile/${HANDLE}/post/${String(j.uri).split("/").pop()}` };
}

async function mastodon(text) {
  const MTOK = process.env.MASTODON_TOKEN;
  if (!MTOK) return { status: "skipped", why: "no creds" };
  const status = text.replace(/receiptspack\.vercel\.app\/\S+/, (m) => "https://" + m);
  const h = crypto.createHash("sha1").update(status).digest("hex").slice(0, 16);
  const r = await fetch("https://mastodon.social/api/v1/statuses", { method: "POST", headers: { authorization: "Bearer " + MTOK, "content-type": "application/json", "Idempotency-Key": h }, body: JSON.stringify({ status, visibility: "public", language: "en" }) });
  const j = await r.json();
  if (!r.ok) return { status: "failed", why: JSON.stringify(j).slice(0, 160) };
  return { status: "sent", url: j.url };
}

let sent = 0;
for (const [ch, fn] of [["bluesky", bluesky], ["mastodon", mastodon]]) {
  const text = variant(ch);
  const hash = crypto.createHash("sha1").update(text).digest("hex").slice(0, 12);
  if (BAN.test(text)) { console.log("repurpose ban", ch); continue; }
  if (used.has(hash) || log.some(p => p.channel === ch && p.kind === "repurpose" && p.ts.slice(0, 10) === today && p.status === "sent")) {
    console.log("repurpose skip", ch); continue;
  }
  let res;
  try { res = await fn(text); } catch (e) { res = { status: "failed", why: String(e.message || e).slice(0, 160) }; }
  log.push({ ts: new Date().toISOString(), channel: ch, kind: "repurpose", status: res.status, url: res.url || null, why: res.why || null, captionHash: hash, slug: page.slug });
  console.log(`repurpose ${ch} ${res.status} ${res.url || res.why || ""}`);
  if (res.status === "sent") sent++;
}
fs.writeFileSync(LOG, JSON.stringify(log, null, 1));
console.log("repurpose sent", sent, "guide", page.slug);
