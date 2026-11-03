#!/usr/bin/env node
// Cross-post today's video to YouTube Shorts via Buffer (free plan) GraphQL API.
// Usage: node scripts/cross-post-youtube.mjs <path-to-video.mp4>  (expects <video>.json sidecar)
// Runs only when a new daily video was generated or on manual dispatch.
import fs from "node:fs";
const KEY = process.env.BUFFER_API_KEY;
const SITE = process.env.APP_URL || "https://receipts-blond.vercel.app";
const file = process.argv[2] || "public/videos/day-001.mp4";
const videoUrl = `${SITE}/videos/${file.split("/").pop()}`;

let meta = {};
try { meta = JSON.parse(fs.readFileSync(file + ".json", "utf8")); } catch {}
const dayN = meta.day || 1;
const hook = meta.hook || "They said I wasn't ready. So I kept the receipt.";
const title = `Day ${dayN}: ${hook}`.slice(0, 100);
const caption = `${hook}\n\nOne receipt, one measurable standard, thirty days of evidence. The 30-day Receipts system — link in bio ($29).\n\n#provethemwrong #selfimprovement #motivation #30daychallenge #receipts`.slice(0, 4900);

if (!KEY) { console.log("BUFFER_API_KEY not set — skip"); process.exit(0); }
const gql = async (query) => { const r = await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query }) }); const j = await r.json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data; };
// wait until Vercel serves the video (deploy may lag)
for (let i = 0; i < 30; i++) { const r = await fetch(videoUrl, { method: "HEAD" }).catch(() => ({ status: 0 })); if (r.status === 200) break; if (i === 29) throw new Error("video not reachable: " + videoUrl); await new Promise(r => setTimeout(r, 20000)); }
const orgs = (await gql(`{account{organizations{id}}}`)).account.organizations;
let channel;
for (const o of orgs) { const ch = (await gql(`{channels(input:{organizationId:"${o.id}"}){id name service}}`)).channels; channel = ch.find(c => c.service.toLowerCase() === "youtube"); if (channel) break; }
if (!channel) { console.log("no youtube channel connected"); process.exit(0); }
const res = await gql(`mutation{createPost(input:{text:${JSON.stringify(caption)},channelId:"${channel.id}",schedulingType:automatic,mode:shareNow,assets:[{video:{url:"${videoUrl}",metadata:{thumbnailOffset:1000}}}],metadata:{youtube:{title:${JSON.stringify(title)},madeForKids:false,privacy:public}}}){... on PostActionSuccess{post{id}} ... on MutationError{message}}}`);
console.log("youtube:", JSON.stringify(res.createPost));
if (res.createPost.message) process.exit(1);
