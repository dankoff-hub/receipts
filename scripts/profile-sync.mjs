// Keeps Bluesky + Mastodon bios in sync with content/profile.json (the only tappable path from a post is the profile link).
import fs from "node:fs";
const P = JSON.parse(fs.readFileSync("content/profile.json", "utf8"));
const HANDLE = process.env.BLUESKY_HANDLE, APP_PW = process.env.BLUESKY_APP_PASSWORD, MTOK = process.env.MASTODON_TOKEN;
if (HANDLE && APP_PW) {
  const s = await (await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: HANDLE, password: APP_PW }) })).json();
  const H = { authorization: "Bearer " + s.accessJwt, "content-type": "application/json" };
  const cur = await (await fetch(`https://bsky.social/xrpc/com.atproto.repo.getRecord?repo=${s.did}&collection=app.bsky.actor.profile&rkey=self`, { headers: H })).json().catch(() => ({}));
  const rec = { ...(cur.value || { $type: "app.bsky.actor.profile" }), displayName: P.displayName, description: P.bluesky };
  const r = await fetch("https://bsky.social/xrpc/com.atproto.repo.putRecord", { method: "POST", headers: H, body: JSON.stringify({ repo: s.did, collection: "app.bsky.actor.profile", rkey: "self", record: rec, ...(cur.cid ? { swapRecord: cur.cid } : {}) }) });
  console.log("bluesky profile:", r.status);
} else console.log("bluesky: no creds");
if (MTOK) {
  const fd = new FormData(); fd.append("display_name", P.displayName); fd.append("note", P.mastodon_note);
  (P.mastodon_fields || []).forEach(([n, v], i) => { fd.append(`fields_attributes[${i}][name]`, n); fd.append(`fields_attributes[${i}][value]`, v); });
  const r = await fetch("https://mastodon.social/api/v1/accounts/update_credentials", { method: "PATCH", headers: { authorization: "Bearer " + MTOK }, body: fd });
  console.log("mastodon profile:", r.status, r.ok ? "" : (await r.text()).slice(0, 200));
} else console.log("mastodon: no creds");
