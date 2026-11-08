#!/usr/bin/env node
// Community — turns attention into followers on Bluesky + Mastodon (followers are the leading metric for revenue).
// Every cycle: (1) follow back every new follower, (2) reply to every reply/mention/quote on our posts (as Dan, human, non-promotional),
// (3) follow a capped number of relevant people from the lead pool (habit / 30-day / accountability posters; never sellers).
// Caps (repo vars): COMMUNITY_REPLY_CAP (default 20/day across both), FOLLOW_DAILY_CAP (default 20/day per platform). No unfollow automation ever.
// Medium-tier per DIRECTIVE (organic replies + follows within platform norms). Dry-run without creds. Log: swarm/COMMUNITY_LOG.json.
import fs from "node:fs";
import { chat, parseJSON, saveQuota, skillHint } from "./llm.mjs";
process.on("exit", () => saveQuota());
const HANDLE = process.env.BLUESKY_HANDLE, APP_PW = process.env.BLUESKY_APP_PASSWORD, MTOK = process.env.MASTODON_TOKEN;
const SEND = process.env.CLOSER_SEND === "1"; // same founder authorization as the Closer (2026-11-07)
const REPLY_CAP = Number(process.env.COMMUNITY_REPLY_CAP || 20), FOLLOW_CAP = Number(process.env.FOLLOW_DAILY_CAP || 20);
const LOG_P = "swarm/COMMUNITY_LOG.json";
const load = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };
const log = load(LOG_P, { replies: [], follows: [], seen: {} });
const today = new Date().toISOString().slice(0, 10);
const cnt = (arr, f) => arr.filter(x => x.at.slice(0, 10) === today && x.status === "sent" && f(x)).length;
let replyBudget = REPLY_CAP - cnt(log.replies, () => true);
const followBudget = { bluesky: FOLLOW_CAP - cnt(log.follows, x => x.platform === "bluesky"), mastodon: FOLLOW_CAP - cnt(log.follows, x => x.platform === "mastodon") };
const repliedTo = new Set(log.replies.map(r => r.target)), followed = new Set(log.follows.map(f => f.platform + ":" + f.who));
const seller = /https?:\/\/|\b(buy|discount|promo|coupon|course|coaching|dm me|link in bio|affiliate|crypto|forex|nft|casino)\b/i;
const bad = /\b(guarantee|guaranteed|cure|therapy|diagnos|invest|returns|earn \$|make money|limited time|buy now|only \$|discount)\b/i;
const out = { bluesky: { followBack: 0, replies: 0, follows: 0 }, mastodon: { followBack: 0, replies: 0, follows: 0 } };
const strip = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

async function draftReply(theirText, context) {
  const r = await chat(`Someone ${context} on Bluesky/Mastodon. Their words: """${theirText.slice(0, 600)}""". You are Dan, a regular guy logging one honest line a day for 30 days to prove doubters wrong. Write a warm, specific reply (max 220 chars, plain text, no hashtags, no emojis, no links, no quotes). Thank or acknowledge what THEY said in concrete terms, add one useful or lightly funny line, and end with a short question that invites them to keep talking (about their own goal or day). Never pitch, never mention a product or price. Return JSON {"reply":"..."}.`,
    { system: "You write short, human, non-promotional replies. JSON only. " + skillHint("social-reply-and-comment-writer", 500), maxTokens: 160 });
  let t = parseJSON(r.text)?.reply?.trim();
  let provider = r.provider;
  if (!t) {
    const words = String(theirText || "").replace(/[^\w\s']/g, " ").split(/\s+/).filter(w => w.length > 4);
    t = `${(words[0] || "That").slice(0, 24)} is worth keeping. What does tomorrow's one line look like?`;
    provider = "template";
  }
  if (t.length > 280 || bad.test(t) || /https?:\/\//.test(t)) return null;
  return { text: t, provider };
}
const record = (kind, o) => { log[kind].push({ at: new Date().toISOString(), ...o }); };

// ---------------- Bluesky ----------------
async function bluesky() {
  if (!HANDLE || !APP_PW) { console.log("community: bluesky creds missing — skip"); return; }
  const s = await (await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: HANDLE, password: APP_PW }) })).json();
  if (!s.accessJwt) { console.log("community: bluesky login failed"); return; }
  const auth = { authorization: "Bearer " + s.accessJwt, "content-type": "application/json" };
  const create = (collection, rec) => fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", { method: "POST", headers: auth, body: JSON.stringify({ repo: s.did, collection, record: { $type: collection, createdAt: new Date().toISOString(), ...rec } }) });
  const follow = async (did, handle, reason) => {
    if (followBudget.bluesky <= 0 || followed.has("bluesky:" + did) || did === s.did) return false;
    if (!SEND) { record("follows", { platform: "bluesky", who: did, handle, reason, status: "draft" }); return true; }
    const r = await create("app.bsky.graph.follow", { subject: did });
    record("follows", { platform: "bluesky", who: did, handle, reason, status: r.ok ? "sent" : "failed" }); if (r.ok) { followBudget.bluesky--; followed.add("bluesky:" + did); } return r.ok;
  };
  // notifications
  const n = await (await fetch("https://bsky.social/xrpc/app.bsky.notification.listNotifications?limit=60", { headers: auth })).json();
  for (const x of (n.notifications || [])) {
    if (x.author?.did === s.did) continue;
    if (x.reason === "follow") { if (!x.author?.viewer?.following && await follow(x.author.did, x.author.handle, "follow-back")) out.bluesky.followBack++; continue; }
    if (["reply", "mention", "quote"].includes(x.reason) && !repliedTo.has(x.uri) && replyBudget > 0) {
      const theirs = x.record?.text || ""; if (!theirs || seller.test(theirs)) { record("replies", { platform: "bluesky", target: x.uri, author: x.author?.handle, status: "skipped", why: "empty/seller" }); continue; }
      const d = await draftReply(theirs, x.reason === "quote" ? "quoted your post" : x.reason === "mention" ? "mentioned you" : "replied to your post");
      if (!d) { record("replies", { platform: "bluesky", target: x.uri, author: x.author?.handle, status: "skipped", why: "no safe draft" }); continue; }
      const root = x.record?.reply?.root || { uri: x.uri, cid: x.cid };
      if (!SEND) { record("replies", { platform: "bluesky", target: x.uri, author: x.author?.handle, text: d.text, status: "draft" }); continue; }
      const r = await create("app.bsky.feed.post", { text: d.text, langs: ["en"], reply: { root, parent: { uri: x.uri, cid: x.cid } } });
      const j = await r.json().catch(() => ({}));
      record("replies", { platform: "bluesky", target: x.uri, author: x.author?.handle, text: d.text, status: r.ok ? "sent" : "failed", url: r.ok ? `https://bsky.app/profile/${HANDLE}/post/${j.uri.split("/").pop()}` : null, provider: d.provider });
      if (r.ok) { replyBudget--; out.bluesky.replies++; repliedTo.add(x.uri); await follow(x.author.did, x.author.handle, "engaged-with-us"); }
    }
  }
  await fetch("https://bsky.social/xrpc/app.bsky.notification.updateSeen", { method: "POST", headers: auth, body: JSON.stringify({ seenAt: new Date().toISOString() }) }).catch(() => {});
  // targeted follows from the lead pool (people personally working on a habit / 30-day goal)
  const leads = load("swarm/LEADS.json", { leads: [] }).leads.filter(l => l.src.includes("bluesky") && l.sub && !seller.test(l.text || "") && l.tier <= 2 && !followed.has("bluesky:" + l.sub) && !/danrossi2026/.test(l.sub)).sort((a, b) => a.tier - b.tier || new Date(b.at) - new Date(a.at));
  for (const l of leads) {
    if (followBudget.bluesky <= 0) break;
    const did = l.sub.startsWith("did:") ? l.sub : (await (await fetch(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(l.sub)}`)).json().catch(() => ({})))?.did;
    if (did && await follow(did, l.sub, `lead tier ${l.tier}`)) out.bluesky.follows++;
  }
}

// ---------------- Mastodon ----------------
async function mastodon() {
  if (!MTOK) { console.log("community: mastodon token missing — skip"); return; }
  const H = "https://mastodon.social", auth = { authorization: "Bearer " + MTOK };
  const me = await (await fetch(`${H}/api/v1/accounts/verify_credentials`, { headers: auth })).json(); if (!me.id) { console.log("community: mastodon auth failed"); return; }
  const follow = async (id, acct, reason) => {
    if (followBudget.mastodon <= 0 || followed.has("mastodon:" + id) || id === me.id) return false;
    if (!SEND) { record("follows", { platform: "mastodon", who: id, handle: acct, reason, status: "draft" }); return true; }
    const r = await fetch(`${H}/api/v1/accounts/${id}/follow`, { method: "POST", headers: auth });
    record("follows", { platform: "mastodon", who: id, handle: acct, reason, status: r.ok ? "sent" : "failed" }); if (r.ok) { followBudget.mastodon--; followed.add("mastodon:" + id); } return r.ok;
  };
  const since = log.seen.mastodon ? `&since_id=${log.seen.mastodon}` : "";
  const n = await (await fetch(`${H}/api/v1/notifications?limit=40&types[]=follow&types[]=mention${since}`, { headers: auth })).json();
  if (!Array.isArray(n)) { console.log("community: mastodon notifications error", JSON.stringify(n).slice(0, 120)); return; }
  if (n[0]?.id) log.seen.mastodon = n[0].id;
  const rel = {}; const ids = [...new Set(n.map(x => x.account?.id).filter(Boolean))];
  if (ids.length) for (const r of await (await fetch(`${H}/api/v1/accounts/relationships?${ids.map(i => "id[]=" + i).join("&")}`, { headers: auth })).json().catch(() => [])) rel[r.id] = r;
  for (const x of n) {
    if (x.type === "follow") { if (!rel[x.account.id]?.following && await follow(x.account.id, x.account.acct, "follow-back")) out.mastodon.followBack++; continue; }
    if (x.type === "mention" && x.status && !repliedTo.has("masto:" + x.status.id) && replyBudget > 0) {
      const theirs = strip(x.status.content).replace(/@\S+/g, "").trim(); if (!theirs || seller.test(theirs)) { record("replies", { platform: "mastodon", target: "masto:" + x.status.id, author: x.account.acct, status: "skipped", why: "empty/seller" }); continue; }
      const d = await draftReply(theirs, x.status.in_reply_to_account_id === me.id ? "replied to your post" : "mentioned you");
      if (!d) { record("replies", { platform: "mastodon", target: "masto:" + x.status.id, author: x.account.acct, status: "skipped", why: "no safe draft" }); continue; }
      const status = `@${x.account.acct} ${d.text}`;
      if (!SEND) { record("replies", { platform: "mastodon", target: "masto:" + x.status.id, author: x.account.acct, text: status, status: "draft" }); continue; }
      const r = await fetch(`${H}/api/v1/statuses`, { method: "POST", headers: { ...auth, "content-type": "application/json", "Idempotency-Key": "c" + x.status.id }, body: JSON.stringify({ status, in_reply_to_id: x.status.id, visibility: "public", language: "en" }) });
      const j = await r.json().catch(() => ({}));
      record("replies", { platform: "mastodon", target: "masto:" + x.status.id, author: x.account.acct, text: status, status: r.ok ? "sent" : "failed", url: j.url || null, provider: d.provider });
      if (r.ok) { replyBudget--; out.mastodon.replies++; repliedTo.add("masto:" + x.status.id); await follow(x.account.id, x.account.acct, "engaged-with-us"); }
    }
  }
  const leads = load("swarm/LEADS.json", { leads: [] }).leads.filter(l => l.src.includes("mastodon") && l.sub && !seller.test(l.text || "") && l.tier <= 2 && !/danrossi2026/.test(l.sub)).sort((a, b) => a.tier - b.tier || new Date(b.at) - new Date(a.at));
  for (const l of leads) {
    if (followBudget.mastodon <= 0) break;
    let acct = l.sub.replace(/^@/, ""); try { const host = new URL(l.url).host; if (!acct.includes("@") && host !== "mastodon.social") acct += "@" + host; } catch {}
    const a = await (await fetch(`${H}/api/v1/accounts/lookup?acct=${encodeURIComponent(acct)}`, { headers: auth })).json().catch(() => ({}));
    if (a.id && !followed.has("mastodon:" + a.id) && await follow(a.id, acct, `lead tier ${l.tier}`)) out.mastodon.follows++;
  }
}

try { await bluesky(); } catch (e) { console.log("community: bluesky error", e.message); }
try { await mastodon(); } catch (e) { console.log("community: mastodon error", e.message); }
log.replies = log.replies.slice(-2000); log.follows = log.follows.slice(-5000);
fs.writeFileSync(LOG_P, JSON.stringify(log, null, 1));
console.log(`community: ${SEND ? "SEND" : "DRAFT"} — ${JSON.stringify(out)}; reply budget left ${replyBudget}, follow budget ${JSON.stringify(followBudget)}`);
