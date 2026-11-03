#!/usr/bin/env node
// Buffer → TikTok publisher. Free Buffer plan. Always shareNow. Strips # for TikTok captions.
const fs = require("fs");
const SITE = "https://receipts-blond.vercel.app";
const KEY = process.env.BUFFER_API_KEY;
if (!KEY) { console.log("BUFFER_API_KEY not set — publish skipped"); process.exit(0); }
const b = JSON.parse(fs.readFileSync("state/publish-queue.json", "utf8"));
const vi = b.find(a => a.hasOwnProperty("when") && a.when === "now");      // immediate override
const act = vi || b.find(a => !a.hasOwnProperty("when") || a.when !== "skip");
if (!act) { console.log("no action"); process.exit(0); }
const V = SITE + "/videos/" + act.video;
const o = (q, a) => new Promise(res => {
  const u = require("https").request({
    hostname: "api.buffer.com", path: "/", method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + KEY },
  }, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(JSON.parse(d))); });
  u.write(JSON.stringify({ query: q })); u.end();
});
const gql = async query => { const j = await o(query); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data; };
async function wait200(url, n = 40) {
  for (let i = 0; i < n; i++) {
    const s = await fetch(url, { method: "GET" }).then(r => r.status).catch(() => 0);
    if (s === 200) return;
    console.log("not ready", s, "retry");
    await new Promise(r => setTimeout(r, 10000));
  }
  throw new Error("video not reachable: " + url);
}
async function fn(p, q, r, m) {
  await wait200(V);
  const os = (await gql(`{account{organizations{id name}}}`)).account;
  let k;
  for (const O of os.organizations) {
    const ch = (await gql(`{channels(input:{organizationId:"${O.id}"}){id name service}}`)).channels;
    k = ch.find(x => x.service.toLowerCase() === "tiktok");
    if (k) break;
  }
  if (!k) { console.log("no tiktok channel"); return; }
  const cap = m ? p.caption : p.caption.replace(/#\S+/g, "").trim();
  const q2 = `mutation{createPost(input:{text:${JSON.stringify(cap)},channelId:"${k.id}",schedulingType:automatic,mode:shareNow,assets:[{video:{url:"${V}",metadata:{thumbnailOffset:500}}}]}){... on PostActionSuccess{post{id}} ... on MutationError{message}}}`;
  const R = await gql(q2);
  console.log("R" + (r ? "retry" : ""), JSON.stringify(R.createPost));
  if (R.createPost.message || R.createPost.post?.id == null) process.exit(1);
}
const j = JSON.parse(fs.readFileSync(act.video.replace(/^.*?(day-\d+\.mp4)$/, "public/videos/$1") + ".json", "utf8"));
(async () => { try { await fn(j, null, false, 0); } catch (e) { console.error("E1", e); try { await fn(j, null, true, 1); } catch (x) { console.error("E2", x); process.exit(1); } } })();
