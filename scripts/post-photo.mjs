#!/usr/bin/env node
// Post the next lifestyle photo (content/photo-queue.json order) to Instagram via Buffer as a single-image feed post.
// One per UTC day (founder photo on even day-of-year, Workers-AI image on odd), never the same photo twice, never a caption hash already in the ledger.
// Usage: node scripts/post-photo.mjs
import fs from "node:fs";
import crypto from "node:crypto";
import { withLinkLine } from "./first-comment.mjs";
const KEY = process.env.BUFFER_API_KEY;
const SITE = process.env.APP_URL || "https://receipts-blond.vercel.app";
const LOG = "content/post-log.json", LEDGER = "content/caption-ledger.json", CH = "instagram_photo";
const load = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };
if (!KEY) { console.log("BUFFER_API_KEY not set — skip"); process.exit(0); }
const cfg = load("content/audience-config.json", {});
if (cfg.paused?.instagram?.until && new Date(cfg.paused.instagram.until) > new Date()) { console.log("instagram paused — skip photo"); process.exit(0); }
const log = load(LOG, []);
const today = new Date().toISOString().slice(0, 10);
if (log.some(p => p.channel === CH && p.status === "sent" && p.ts?.slice(0, 10) === today)) { console.log("photo already posted today"); process.exit(0); }
const queue = load("content/photo-queue.json", { queue: [] }).queue;
const caps = load("content/photo-captions.json", { captions: {} }).captions;
// Alternating days: if scripts/make-ai-photo.mjs produced a generated image today, post that; otherwise the next founder photo.
const aiToday = load("content/ai-photo-queue.json", { queue: [] }).queue.find(q => q.day === today && !log.some(p => p.channel === CH && p.video === q.file && p.status !== "failed"));
const next = aiToday || queue.find(q => !log.some(p => p.channel === CH && p.video === q.file && p.status !== "failed") && log.filter(p => p.channel === CH && p.video === q.file).length < 2);
if (!next) { console.log("photo queue exhausted — add photos to content/photo-queue.json"); process.exit(0); }
const caption = caps[next.slug];
if (!caption) { console.log("no caption for", next.slug); process.exit(1); }
const hash = crypto.createHash("md5").update(caption).digest("hex");
const ledger = load(LEDGER, {});
const used = JSON.stringify(ledger).includes(hash);
if (used) { console.log("caption already used — refusing to repeat:", next.slug); process.exit(1); }
const url = `${SITE}/photos/${next.file}`;
for (let i = 0; i < 15; i++) { const r = await fetch(url, { method: "HEAD" }).catch(() => ({ status: 0 })); if (r.status === 200) break; if (i === 14) throw new Error("photo not reachable: " + url); await new Promise(r => setTimeout(r, 20000)); }
const gql = async q => { const j = await (await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query: q }) })).json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data; };
const orgs = (await gql(`{account{organizations{id}}}`)).account.organizations;
let channel; for (const o of orgs) { channel = (await gql(`{channels(input:{organizationId:"${o.id}"}){id service}}`)).channels.find(c => c.service.toLowerCase() === "instagram"); if (channel) break; }
if (!channel) { console.log("no instagram channel"); process.exit(0); }
const text = JSON.stringify(withLinkLine(caption)); // Buffer free: no first comment, link line in caption
let res;
try {
  res = await gql(`mutation{createPost(input:{text:${text},channelId:"${channel.id}",schedulingType:automatic,mode:shareNow,assets:[{image:{url:"${url}"}}],metadata:{instagram:{type:post,shouldShareToFeed:true}}}){... on PostActionSuccess{post{id}} ... on MutationError{message}}}`);
} catch (e) {
  console.log("retry without instagram metadata:", e.message.slice(0, 300));
  res = await gql(`mutation{createPost(input:{text:${text},channelId:"${channel.id}",schedulingType:automatic,mode:shareNow,assets:[{image:{url:"${url}"}}]}){... on PostActionSuccess{post{id}} ... on MutationError{message}}}`);
}
console.log("instagram photo:", next.file, JSON.stringify(res.createPost));
log.push({ ts: new Date().toISOString(), channel: CH, postId: res.createPost.post?.id || null, status: res.createPost.message ? "failed" : "sent", video: next.file, slug: next.slug, captionHash: hash });
fs.writeFileSync(LOG, JSON.stringify(log, null, 1));
if (!res.createPost.message) { ledger.photos ??= {}; ledger.photos[next.slug] = { hash, ts: new Date().toISOString() }; fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1)); }
if (res.createPost.message) process.exit(1);
