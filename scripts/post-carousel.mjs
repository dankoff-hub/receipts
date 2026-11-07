#!/usr/bin/env node
// Post a generated carousel (public/carousels/<name>/N.png) to Instagram via Buffer as a multi-image post.
// Usage: node scripts/post-carousel.mjs public/carousels/<name>
import fs from "node:fs";
import crypto from "node:crypto";
import { withLinkLine } from "./first-comment.mjs";
const KEY = process.env.BUFFER_API_KEY;
const SITE = process.env.APP_URL || "https://receipts-blond.vercel.app";
const dir = process.argv[2]; const name = dir.split("/").pop();
const meta = JSON.parse(fs.readFileSync(dir + ".json", "utf8"));
const urls = Array.from({ length: meta.slides }, (_, i) => `${SITE}/carousels/${name}/${i + 1}.png`);
if (!KEY) { console.log("BUFFER_API_KEY not set — skip"); process.exit(0); }
const cfg = (() => { try { return JSON.parse(fs.readFileSync("content/audience-config.json", "utf8")); } catch { return {}; } })();
if (cfg.paused?.instagram?.until && new Date(cfg.paused.instagram.until) > new Date()) { console.log("instagram paused — skip carousel"); process.exit(0); }
const gql = async q => { const j = await (await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query: q }) })).json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data; };
for (let i = 0; i < 45; i++) { const r = await fetch(urls[urls.length - 1], { method: "HEAD" }).catch(() => ({ status: 0 })); if (r.status === 200) break; if (i === 44) throw new Error("slides not reachable: " + urls[0]); await new Promise(r => setTimeout(r, 20000)); }
const orgs = (await gql(`{account{organizations{id}}}`)).account.organizations;
let channel; for (const o of orgs) { channel = (await gql(`{channels(input:{organizationId:"${o.id}"}){id service}}`)).channels.find(c => c.service.toLowerCase() === "instagram"); if (channel) break; }
if (!channel) { console.log("no instagram channel"); process.exit(0); }
const assets = urls.map(u => `{image:{url:"${u}"}}`).join(",");
const text = JSON.stringify(withLinkLine(meta.caption)); // Buffer free: no first comment, link line in caption
let res;
try {
  res = await gql(`mutation{createPost(input:{text:${text},channelId:"${channel.id}",schedulingType:automatic,mode:shareNow,assets:[${assets}],metadata:{instagram:{type:post,shouldShareToFeed:true}}}){... on PostActionSuccess{post{id}} ... on MutationError{message}}}`);
} catch (e) {
  console.log("retry without instagram metadata:", e.message.slice(0, 300));
  res = await gql(`mutation{createPost(input:{text:${text},channelId:"${channel.id}",schedulingType:automatic,mode:shareNow,assets:[${assets}]}){... on PostActionSuccess{post{id}} ... on MutationError{message}}}`);
}
console.log("instagram carousel:", JSON.stringify(res.createPost));
const p = "content/post-log.json"; const l = JSON.parse(fs.readFileSync(p, "utf8") || "[]");
l.push({ ts: new Date().toISOString(), channel: "instagram_carousel", postId: res.createPost.post?.id || null, status: res.createPost.message ? "failed" : "sent", video: name, day: meta.day, captionHash: crypto.createHash("md5").update(meta.caption).digest("hex") });
fs.writeFileSync(p, JSON.stringify(l, null, 1));
if (res.createPost.message) process.exit(1);
