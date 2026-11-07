// Schedules today's video to TikTok via Buffer (free plan) GraphQL API. Needs BUFFER_API_KEY.
import fs from "node:fs";
import crypto from "node:crypto";
const KEY = process.env.BUFFER_API_KEY; const SITE = process.env.APP_URL || "https://receipts-blond.vercel.app";
const file = process.argv[2];
const meta = JSON.parse(fs.readFileSync(file + ".json", "utf8"));
const videoUrl = `${SITE}/videos/${file.split("/").pop()}`;
if (!KEY) { console.log("BUFFER_API_KEY not set — video generated but not scheduled:", videoUrl); process.exit(0); }
const gql = async (query) => { const r = await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query }) }); const j = await r.json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data; };
// wait until Vercel serves the video (deploy may lag)
for (let i = 0; i < 45; i++) { const r = await fetch(videoUrl, { method: "HEAD" }).catch(() => ({ status: 0 })); if (r.status === 200) break; if (i === 44) throw new Error("video not reachable: " + videoUrl); await new Promise(r => setTimeout(r, 20000)); }
const orgs = (await gql(`{ account { organizations { id name } } }`)).account.organizations;
let channel;
for (const o of orgs) { const ch = (await gql(`{ channels(input:{organizationId:"${o.id}"}) { id name service } }`)).channels; channel = ch.find(c => c.service.toLowerCase() === "tiktok"); if (channel) break; }
if (!channel) throw new Error("No TikTok channel connected in Buffer");
const text = JSON.stringify((meta.captions && meta.captions.tiktok) || meta.caption);
const res = await gql(`mutation { createPost(input:{ text:${text}, channelId:"${channel.id}", schedulingType: automatic, mode: shareNow, assets:[{ video:{ url:"${videoUrl}", metadata:{ thumbnailOffset: 1000 } } }] }) { ... on PostActionSuccess { post { id dueAt } } ... on MutationError { message } } }`);
console.log("Buffer:", JSON.stringify(res.createPost));
try {
  const p = "content/post-log.json";
  const l = JSON.parse(fs.readFileSync(p, "utf8") || "[]");
  l.push({ ts: new Date().toISOString(), channel: "tiktok", postId: res.createPost.post?.id || null, dueAt: res.createPost.post?.dueAt || null, status: res.createPost.message ? "failed" : "sent", video: file.split("/").pop(), day: meta.day || null, captionHash: crypto.createHash("md5").update(JSON.parse(text)).digest("hex") });
  fs.writeFileSync(p, JSON.stringify(l, null, 1));
} catch (e) { console.error("post-log write FAILED (would cause repeats):", e.message); process.exit(1); }
if (res.createPost.message) process.exit(1);
