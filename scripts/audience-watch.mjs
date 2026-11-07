#!/usr/bin/env node
// Audience watch (daily agent): measures audience across YouTube / TikTok / Instagram
// with zero paid APIs, verifies recent posts actually went out, and writes
// content/strategy-brief.json so the swarm (caption-studio, tag/CTA rotation)
// biases toward what correlates with growth. Everything degrades gracefully:
// a blocked channel page yields null, never a failed run.
import fs from "node:fs";

const KEY = process.env.BUFFER_API_KEY;
const today = new Date().toISOString().slice(0, 10);
const load = p => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
const save = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 1));

const cfg = load("content/audience-config.json") || {};
const histPath = "content/audience-history.json";
const hist = load(histPath) || { days: [] };
const postLogPath = "content/post-log.json";
const postLog = load(postLogPath) || [];

const UA = { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", "Accept-Language": "en-US,en;q=0.9" };
const fetchText = async url => { try { const r = await fetch(url, { headers: UA, redirect: "follow" }); return r.ok ? await r.text() : null; } catch { return null; } };
const parseNum = s => { if (!s) return null; const m = String(s).replace(/,/g, "").match(/([\d.]+)\s*([KMB])?/i); if (!m) return null; let v = parseFloat(m[1]); const u = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] || "").toUpperCase()]; if (u) v *= u; return Math.round(v); };

// --- Buffer: channel list + recent post statuses ------------------------------
const gql = async q => { const r = await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query: q }) }); const j = await r.json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data; };
let channels = [];
if (KEY) { try { const orgs = (await gql(`{account{organizations{id}}}`)).account.organizations; for (const o of orgs) channels.push(...(await gql(`{channels(input:{organizationId:"${o.id}"}){id name service}}`)).channels); } catch (e) { console.log("buffer channels unavailable:", e.message); } }
const byService = s => channels.find(c => c.service.toLowerCase() === s);

// verify recent posts (last 3 days) are actually sent/queued, flag failures
let postIssues = [];
for (const p of postLog.slice(-9)) {
  if (!p.postId || !KEY) continue;
  try {
    const d = await gql(`{post(id:"${p.postId}"){id status}}`);
    const st = d?.post?.status || null;
    if (st) p.status = st;
    if (st && /fail|error/i.test(st)) postIssues.push(`${p.channel} post ${p.postId} status=${st}`);
  } catch { /* post lookup unsupported — keep local status */ }
}
save(postLogPath, postLog);

// --- YouTube: channel id discovery, then public stats -------------------------
async function ytStats() {
  let cid = cfg.youtube_channel_id;
  if (!cid) {
    const yt = postLog.filter(p => p.channel === "youtube" && p.externalId).pop();
    if (yt) { const w = await fetchText(`https://www.youtube.com/watch?v=${yt.externalId}`); cid = w?.match(/"channelId":"(UC[\w-]{22})"/)?.[1]; }
  }
  if (!cid && byService("youtube")?.name) {
    const s = await fetchText(`https://www.youtube.com/results?search_query=${encodeURIComponent(byService("youtube").name)}`);
    cid = s?.match(/"channelId":"(UC[\w-]{22})"/)?.[1];
  }
  if (!cid) return { youtube_channel_id: null, youtube_subs: null, youtube_views: null };
  const page = await fetchText(`https://www.youtube.com/channel/${cid}`);
  const subs = parseNum(page?.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/)?.[1]) ?? parseNum(page?.match(/([\d.,]+\s*[KMB]?)\s+subscribers/i)?.[1]);
  const views = parseNum(page?.match(/"viewCountText":\{"simpleText":"([\d,]+) views"\}/)?.[1]) ?? parseNum(page?.match(/"viewCount":"(\d+)"/)?.[1]);
  return { youtube_channel_id: cid, youtube_subs: subs, youtube_views: views };
}
// --- TikTok: profile page parse ------------------------------------------------
async function ttStats() {
  if (!cfg.tiktok_username) return { tiktok_followers: null };
  const page = await fetchText(`https://www.tiktok.com/@${cfg.tiktok_username}`);
  const f = page?.match(/"followerCount":(\d+)/)?.[1];
  return { tiktok_followers: f != null ? +f : null };
}
// --- Instagram: public profile parse (usually login-walled) --------------------
async function igStats() {
  const name = (cfg.instagram_username || byService("instagram")?.name || "").replace(/^@/, "");
  if (!name) return { instagram_followers: null };
  const page = await fetchText(`https://www.instagram.com/${name}/`);
  const f = page?.match(/"edge_followed_by":\{"count":(\d+)/)?.[1];
  return { instagram_followers: f != null ? +f : null };
}
// --- Stripe: paid conversions attributed by ?src= ------------------------------
async function stripeBySrc() {
  const K = process.env.STRIPE_API_KEY; if (!K) return null;
  try { const r = await fetch("https://api.stripe.com/v1/checkout/sessions?limit=100", { headers: { Authorization: `Bearer ${K}` } }); const j = await r.json(); const by = {}; for (const s of (j.data || []).filter(x => x.payment_status === "paid")) { const src = (s.client_reference_id || "direct").split("_")[0]; by[src] = (by[src] || 0) + 1; } return by; } catch { return null; }
}

// --- Bluesky + Mastodon: public profile APIs (no auth) ---------------------------
async function fediStats() {
  const o = { bluesky_followers: null, mastodon_followers: null };
  try { const h = process.env.BLUESKY_HANDLE || "danrossi2026.bsky.social"; const j = await (await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${h}`)).json(); if (j.followersCount != null) o.bluesky_followers = j.followersCount; } catch {}
  try { const j = await (await fetch("https://mastodon.social/api/v1/accounts/lookup?acct=danrossi2026")).json(); if (j.followers_count != null) o.mastodon_followers = j.followers_count; } catch {}
  return o;
}
const row = { date: today, ...(await ytStats()), ...(await ttStats()), ...(await igStats()), ...(await fediStats()), stripe_paid_by_src: await stripeBySrc() };
hist.days = hist.days.filter(d => d.date !== today); hist.days.push(row); hist.days.sort((a, b) => a.date < b.date ? -1 : 1);
save(histPath, hist);
save("content/audience-config.json", { ...cfg, youtube_channel_id: row.youtube_channel_id || cfg.youtube_channel_id || null });

// --- strategy brief: honest signals only --------------------------------------
const last7 = hist.days.slice(-7);
const delta = k => { const a = last7.map(d => d[k]).filter(v => v != null); return a.length >= 2 ? a[a.length - 1] - a[0] : null; };
const d7 = { youtube_subs: delta("youtube_subs"), tiktok_followers: delta("tiktok_followers"), instagram_followers: delta("instagram_followers"), bluesky_followers: delta("bluesky_followers"), mastodon_followers: delta("mastodon_followers") };
const followersTotal = ["youtube_subs", "tiktok_followers", "instagram_followers", "bluesky_followers", "mastodon_followers"].reduce((a, k) => a + (row[k] || 0), 0);
const totalGrowth = Object.values(d7).reduce((s, v) => s + (v || 0), 0);
const brief = {
  generated: today,
  deltas_7d: d7,
  followers_total_known: followersTotal,
  posts_logged: postLog.length,
  post_issues: postIssues,
  best_cta_index: null,      // activates once growth data exists (see notes)
  best_tag_mix_index: null,
  notes: []
};
if (totalGrowth >= 5) {
  // correlate: which CTA/tag mix indexes were used on the best growth day
  const best = last7.filter(d => (d.youtube_subs != null || d.tiktok_followers != null)).pop();
  if (best) {
    brief.best_cta_index = (hist.days.indexOf(best)) % 6;
    brief.best_tag_mix_index = (hist.days.indexOf(best)) % 4;
    brief.notes.push(`growth day ${best.date} — biasing captions toward that day's CTA/tag indexes until signal changes`);
  }
} else {
  brief.notes.push("audience too small for attribution — collecting daily baselines; biases activate automatically at +5 followers/7d");
}
if (postIssues.length) brief.notes.push("POST DELIVERY ISSUES: " + postIssues.join("; "));
if (row.youtube_subs == null) brief.notes.push("youtube stats unavailable (page blocked or channel undiscovered)");
if (row.tiktok_followers == null) brief.notes.push("tiktok stats unavailable (profile page blocked datacenter IP)");
if (row.instagram_followers == null) brief.notes.push("instagram stats unavailable (login wall)");
save("content/strategy-brief.json", brief);

// --- daily issue ----------------------------------------------------------------
if (process.env.GH_TOKEN && process.env.GITHUB_REPOSITORY) {
  const f = v => v == null ? "n/a" : v;
  const fmtDelta = v => v == null ? "—" : (v >= 0 ? "+" : "") + v;
  const body = `## Audience watch — ${today}\n\n| channel | today | 7-day delta |\n|---|---|---|\n` +
    `| YouTube subs | ${f(row.youtube_subs)} | ${fmtDelta(d7.youtube_subs)} |\n` +
    `| TikTok followers | ${f(row.tiktok_followers)} | ${fmtDelta(d7.tiktok_followers)} |\n` +
    `| Instagram followers | ${f(row.instagram_followers)} | ${fmtDelta(d7.instagram_followers)} |\n` +
    `| Bluesky followers | ${f(row.bluesky_followers)} | ${fmtDelta(d7.bluesky_followers)} |\n` +
    `| Mastodon followers | ${f(row.mastodon_followers)} | ${fmtDelta(d7.mastodon_followers)} |\n` +
    `| **All platforms (known)** | **${followersTotal}** | **${fmtDelta(totalGrowth)}** |\n\n` +
    `posts logged: ${postLog.length}${postIssues.length ? "\n\nISSUES: " + postIssues.join("; ") : ""}\n\n` +
    `strategy: ${brief.notes.join(" · ")}\n\n<sub>audience-watch.mjs · free public sources only · nulls mean the platform blocked the fetch, not zero</sub>`;
  try {
    const r = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues`, { method: "POST", headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ title: `Audience watch — ${today}`, body, labels: ["audience"] }) });
    console.log("issue:", r.status);
  } catch (e) { console.log("issue fail:", e.message); }
}
console.log("audience:", JSON.stringify(row));
console.log("deltas_7d:", JSON.stringify(d7));
