#!/usr/bin/env node
// Cross-post Day 1 video to Instagram Reels via Buffer
import fs from "node:fs";
const KEY = process.env.BUFFER_API_KEY;
const SITE = "https://receipts-blond.vercel.app";
const videoUrl = `${SITE}/videos/day-001.mp4`;
const caption = "They said I wasn't ready. So I kept the receipt.\n\nNot to send them. To prove it.\n\nOne receipt, one measurable standard, thirty days of evidence.\n\nThat is the whole system.\n\n$29 · link in bio\n\n#provethemwrong #selfimprovement #careertok #motivation #discipline #30daychallenge #receipts";
if (!KEY) { console.log("BUFFER_API_KEY not set — skip"); process.exit(0); }
const gql = async (query) => { const r = await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query }) }); const j = await r.json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data; };
// wait for video
for (let i = 0; i < 30; i++) { const r = await fetch(videoUrl, { method: "HEAD" }).catch(() => ({ status: 0 })); if (r.status === 200) break; if (i === 29) throw new Error("video not reachable"); await new Promise(r => setTimeout(r, 10000)); }
const orgs = (await gql(`{account{organizations{id}}}`)).account.organizations;
let channel;
for (const o of orgs) { const ch = (await gql(`{channels(input:{organizationId:"${o.id}"}){id name service}}`)).channels; channel = ch.find(c => c.service.toLowerCase() === "instagram"); if (channel) break; }
if (!channel) { console.log("no instagram channel connected"); process.exit(0); }
const res = await gql(`mutation{createPost(input:{text:${JSON.stringify(caption)},channelId:"${channel.id}",schedulingType:automatic,mode:shareNow,assets:[{video:{url:"${videoUrl}",metadata:{thumbnailOffset:1000}}}],metadata:{instagram:{type:reel,shouldShareToFeed:true}}}){... on PostActionSuccess{post{id}} ... on MutationError{message}}}`);
console.log("instagram:", JSON.stringify(res.createPost));
