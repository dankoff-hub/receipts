#!/usr/bin/env node
// Delete one of OUR OWN Bluesky posts (cleanup of bot mistakes only). Usage: node scripts/bluesky-delete.mjs <post url or at-uri>
const [arg] = process.argv.slice(2); const HANDLE = process.env.BLUESKY_HANDLE, PW = process.env.BLUESKY_APP_PASSWORD;
if (!arg || !HANDLE || !PW) { console.error("usage/creds missing"); process.exit(1); }
const s = await (await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: HANDLE, password: PW }) })).json();
const rkey = arg.split("/").pop(); const m = arg.match(/profile\/([^/]+)\//); if (m && m[1] !== HANDLE && m[1] !== s.did) { console.error("refusing: not our post"); process.exit(1); }
const r = await fetch("https://bsky.social/xrpc/com.atproto.repo.deleteRecord", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + s.accessJwt }, body: JSON.stringify({ repo: s.did, collection: "app.bsky.feed.post", rkey }) });
console.log("delete", rkey, r.status);
