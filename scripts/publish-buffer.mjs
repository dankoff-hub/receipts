// Schedules today's video to TikTok via Buffer (free plan) GraphQL API. Needs BUFFER_API_KEY.
import fs from "node:fs";
const KEY = process.env.BUFFER_API_KEY; const SITE = process.env.APP_URL || "https://receipts-blond.vercel.app";
const meta = JSON.parse(fs.readFileSync(process.argv[2] + ".json", "utf8"));
const videoUrl = `${SITE}/videos/${process.argv[2].split("/").pop()}`;
if (!KEY) { console.log("BUFFER_API_KEY not set — video generated but not scheduled:", videoUrl); process.exit(0); }
const gql = async (query) => { const r = await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query }) }); const j = await r.json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data; };
// wait until Vercel serves the video (deploy may lag)
for (let i = 0; i < 30; i++) { const r = await fetch(videoUrl, { method: "HEAD" }).catch(() => ({ status: 0 })); if (r.status === 200) break; if (i === 29) throw new Error("video not reachable: " + videoUrl); await new Promise(r => setTimeout(r, 20000)); }
const orgs = (await gql(`{ account { organizations { id name } } }`)).account.organizations;
let channel;
for (const o of orgs) { const ch = (await gql(`{ channels(input:{organizationId:"${o.id}"}) { id name service } }`)).channels; channel = ch.find(c => c.service.toLowerCase() === "tiktok"); if (channel) break; }
if (!channel) throw new Error("No TikTok channel connected in Buffer");
const text = JSON.stringify(meta.caption);
const res = await gql(`mutation { createPost(input:{ text:${text}, channelId:"${channel.id}", schedulingType: automatic, mode: addToQueue, assets:[{ video:{ url:"${videoUrl}", metadata:{ thumbnailOffset: 1000 } } }] }) { ... on PostActionSuccess { post { id dueAt } } ... on MutationError { message } } }`);
console.log("Buffer:", JSON.stringify(res.createPost));
if (res.createPost.message) process.exit(1);
