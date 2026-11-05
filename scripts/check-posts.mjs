#!/usr/bin/env node
// Post check (daily): reconciles content/post-log.json against Buffer's real statuses.
// Marks failed posts so publish-pending retries them (up to 2 attempts), and marks
// truly-sent posts sent. Fixes "ledger said sent but channel never got it" drift.
// Usage: node scripts/check-posts.mjs
import fs from "node:fs";
const KEY = process.env.BUFFER_API_KEY;
const LOG = "content/post-log.json";
const log = JSON.parse(fs.readFileSync(LOG, "utf8"));
if (!KEY) { console.log("no key"); process.exit(0); }
const gql = async q => { const r = await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query: q }) }); const j = await r.json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data; };
const orgs = (await gql(`{account{organizations{id}}}`)).account.organizations;
let channels = [];
for (const o of orgs) channels.push(...(await gql(`{channels(input:{organizationId:"${o.id}"}){id name service}}`)).channels);
const chId = svc => channels.find(c => c.service.toLowerCase() === svc)?.id;
let changed = 0;
for (const svc of ["tiktok", "instagram", "youtube"]) {
  const id = chId(svc); if (!id) continue;
  try {
    const d = await gql(`{posts(first:50,input:{organizationId:"${orgs[0].id}",filter:{status:[sent,error,scheduled],channelIds:["${id}"]},sort:[{field:createdAt,direction:desc}]}){edges{node{id status sentAt dueAt}}}}`);
    const posts = (d?.posts?.edges || []).map(e => e.node);
    for (const e of log.filter(p => p.channel === svc && p.postId)) {
      const found = posts.find(p => p.id === e.postId);
      if (!found) continue;
      const mapped = { sent: "sent", error: "failed", scheduled: "queued", sending: "queued" }[found.status];
      if (mapped && mapped !== e.status) { console.log(`${svc} ${e.video} ${e.postId}: ${e.status} -> ${mapped}`); e.status = mapped; changed++; }
      if (found.sentAt && !e.sentAt) e.sentAt = found.sentAt;
    }
  } catch (e) { console.log(svc + " check failed:", e.message); }
}
fs.writeFileSync(LOG, JSON.stringify(log, null, 1));
console.log("reconciled:", changed);
