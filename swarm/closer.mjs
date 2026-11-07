#!/usr/bin/env node
// Closer — replies on Bluesky and Mastodon to fresh Tier-1/2 leads as the founder persona (@danrossi2026.bsky.social).
// Sending requires repo var CLOSER_SEND=1 — set by the founder on 2026-11-07 ("40/day. do posts and replies on other platforms as well") with
// CLOSER_DAILY_CAP=40. Without it the stage is DRAFT-ONLY (drafts land in swarm/CLOSER_LOG.json). Hard daily cap + per-cycle pacing, every reply logged.
// Guardrails: lead < 48h old · Bluesky only · LLM relevance re-check (must be a person personally working on a habit/30-day/accountability goal)
//             · 1 reply per author ever · max CAP replies per UTC day · no link unless Tier 1 explicitly asked for a template/tracker
//             · brand-safety self-check on the draft (no guarantees, no medical/financial claims, no pressure, ≤ 280 chars) · dry-run without creds.
import fs from "node:fs";
import { chat, parseJSON, saveQuota, skillHint } from "./llm.mjs";
process.on("exit", () => saveQuota());
const SEND = process.env.CLOSER_SEND === "1";
const HANDLE = process.env.BLUESKY_HANDLE, APP_PW = process.env.BLUESKY_APP_PASSWORD, CAP = Number(process.env.CLOSER_DAILY_CAP || 3);
const FREE = "receiptspack.vercel.app/free";
const LOG_P = "swarm/CLOSER_LOG.json", LEADS_P = "swarm/LEADS.json";
const load = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };
const log = load(LOG_P, { replies: [], skipped: [] }), leads = load(LEADS_P, { leads: [] });
const today = new Date().toISOString().slice(0, 10);
const sentToday = log.replies.filter(r => r.at.slice(0, 10) === today && r.status === "sent").length;
const repliedAuthors = new Set(log.replies.map(r => r.author));
const MTOK = process.env.MASTODON_TOKEN; // mastodon.social @danrossi2026 (write:statuses)
const platformOf = l => l.src.includes("bluesky") ? "bluesky" : (l.src.includes("mastodon") && /^masto:\d+$/.test(l.id) ? "mastodon" : null);
const OWN = new Set([HANDLE, "danrossi2026.bsky.social", "danrossi2026", "danrossi2026@mastodon.social"].filter(Boolean));
const fresh = leads.leads.filter(l => platformOf(l) && l.status === "new" && !OWN.has(l.sub) && l.at && Date.now() - new Date(l.at) < 48 * 3600e3 && !repliedAuthors.has(l.sub)
  && !/https?:\/\/|\w+\.(io|com|app|co|net|org)\b|\$\d|\b(etsy|gumroad|app store|apps\.apple|play\.google|see the code|democrat|republican|trump|election|giveaway|promo)\b/i.test(l.text)) // skip sellers/apps/politics
  .sort((a, b) => a.tier - b.tier || new Date(b.at) - new Date(a.at)).slice(0, Number(process.env.CLOSER_CONSIDER || 25));
console.log(`closer: ${fresh.length} fresh bluesky/mastodon leads, ${sentToday}/${CAP} replies sent today, mode ${SEND && HANDLE && APP_PW ? "SEND (founder-enabled)" : "DRAFT-ONLY"}`);
// pace: founder cap per UTC day (CLOSER_DAILY_CAP) spread over the cycles of the day (CLOSER_PER_CYCLE) so the account never bursts
let budget = Math.min(CAP - sentToday, Number(process.env.CLOSER_PER_CYCLE || Math.ceil(CAP / 6) + 1)), session = null;
const bad = /\b(guarantee|guaranteed|cure|therapy|diagnos|depress|anxiety disorder|invest|returns|earn \$|make money|limited time|buy now|only \$|discount|act fast)\b/i;

async function login() {
  const r = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: HANDLE, password: APP_PW }) });
  if (!r.ok) throw new Error("bluesky login " + r.status); return r.json();
}
async function postRef(uri) {
  const r = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?uris=${encodeURIComponent(uri)}`); const j = await r.json(); const p = j.posts?.[0]; if (!p) return null;
  const root = p.record?.reply?.root || { uri: p.uri, cid: p.cid }; return { parent: { uri: p.uri, cid: p.cid }, root, author: p.author?.handle, text: p.record?.text || "" };
}
for (const lead of fresh) {
  if (budget <= 0) { console.log("closer: daily cap reached"); break; }
  const mark = (status, why, extra = {}) => { lead.status = status; (status === "sent" ? log.replies : log.skipped).push({ at: new Date().toISOString(), id: lead.id, url: lead.url, author: lead.sub, tier: lead.tier, why, ...extra }); };
  // 1) relevance re-check — LLM must confirm a real, personal, current goal (rule regex over-matches idioms like "30 days to prove them wrong")
  const chk = await chat(`A post: """${lead.text}""" Is the author personally, currently working on (or asking for help with) a habit, streak, 30-day challenge, discipline or accountability goal of their own? Not relevant: creative/art posting series, product or portfolio promotion, news, politics, jokes without a real goal. Reply JSON {"relevant":true|false,"wants_template":true|false,"why":"<10 words"}. wants_template=true only if they explicitly ask for a tracker/template/planner/pdf/system/link.`, { system: "Strict classifier. JSON only.", maxTokens: 120 });
  const c = parseJSON(chk.text);
  if (!c) { mark("skipped", "no classifier available"); continue; }
  if (!c.relevant) { mark("skipped", "not a personal goal: " + (c.why || "")); continue; }
  // 2) draft — helpful first, product last, link only on explicit ask
  const askLink = lead.tier === 1 && c.wants_template;
  const d = await chat(`Write a Bluesky reply (max 240 chars, plain text, no hashtags, no emojis, no quotes around it) to this post: """${lead.text}""". You are Dan, a regular guy who logs one honest line a day for 30 days ("receipts") to prove doubters wrong. Reply like a friend who has been there: one specific, useful or lightly funny line about THEIR goal, then one concrete tactic they can use tomorrow. Never introduce yourself, never say "I'm Dan", never pitch, never mention receipts/30 days unless it answers their question.${askLink ? ` End with: "Free one-page template if useful: ${FREE}"` : " Do NOT include any link or product mention."} Return JSON {"reply":"..."}.`, { system: "You write short, human, non-promotional replies. JSON only. " + skillHint("social-reply-and-comment-writer", 600) + " " + skillHint("openclaudia-bluesky", 300), maxTokens: 200 });
  let reply = parseJSON(d.text)?.reply?.trim();
  if (!reply) { mark("skipped", "no draft"); continue; }
  // 3) self-check (DIRECTIVE §5 high-risk self-check): length, banned claims, no link unless allowed, no @-spam
  if (reply.length > 290) reply = reply.slice(0, 287).replace(/\s+\S*$/, "") + "…";
  if (/^(hey|hi)?[,!\s]*(i'?m|i am|this is) dan\b/i.test(reply) || /prove them wrong, one/i.test(reply)) { mark("skipped", "self-check failed: self-intro/template", { draft: reply }); continue; }
  if (bad.test(reply) || (!askLink && /https?:\/\/|\.vercel\.app|\.com\b/i.test(reply)) || /@\w/.test(reply)) { mark("skipped", "self-check failed", { draft: reply }); continue; }
  const platform = platformOf(lead);
  if (!SEND || (platform === "bluesky" ? !(HANDLE && APP_PW) : !MTOK)) { mark("drafted", SEND ? "no creds" : "draft-only (set repo var CLOSER_SEND=1 to enable sending)", { draft: reply }); budget--; continue; }
  // 4) send — Mastodon: public reply with the @mention (how replies notify on the fediverse)
  if (platform === "mastodon") {
    try {
      const acct = lead.sub ? "@" + lead.sub + " " : "";
      const r = await fetch("https://mastodon.social/api/v1/statuses", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + MTOK, "Idempotency-Key": lead.id }, body: JSON.stringify({ status: acct + reply, in_reply_to_id: lead.id.slice(6), visibility: "public", language: "en" }) });
      const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 200));
      mark("sent", c.why || "", { reply, reply_url: j.url, provider: d.provider, platform });
      repliedAuthors.add(lead.sub); budget--; console.log("closer: replied (mastodon) →", lead.url);
    } catch (e) { mark("failed", e.message.slice(0, 200), { draft: reply, platform }); }
    continue;
  }
  try {
    session ??= await login();
    const ref = await postRef(lead.id); if (!ref) { mark("skipped", "post gone"); continue; }
    if (repliedAuthors.has(ref.author)) { mark("skipped", "author already replied"); continue; }
    const facets = [];
    const li = reply.indexOf(FREE); if (li >= 0) { const b = Buffer.byteLength(reply.slice(0, li)); facets.push({ index: { byteStart: b, byteEnd: b + Buffer.byteLength(FREE) }, features: [{ $type: "app.bsky.richtext.facet#link", uri: "https://" + FREE + "?src=bsky" }] }); }
    const rec = { $type: "app.bsky.feed.post", text: reply, createdAt: new Date().toISOString(), reply: { root: ref.root, parent: ref.parent }, langs: ["en"], ...(facets.length ? { facets } : {}) };
    const r = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + session.accessJwt }, body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.post", record: rec }) });
    const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 200));
    const rk = j.uri.split("/").pop();
    mark("sent", c.why || "", { reply, reply_url: `https://bsky.app/profile/${HANDLE}/post/${rk}`, provider: d.provider, platform: "bluesky" });
    repliedAuthors.add(ref.author); budget--; console.log("closer: replied →", lead.url);
  } catch (e) { mark("failed", e.message.slice(0, 200), { draft: reply }); }
}
log.replies = log.replies.slice(-500); log.skipped = log.skipped.slice(-300);
fs.writeFileSync(LOG_P, JSON.stringify(log, null, 1)); fs.writeFileSync(LEADS_P, JSON.stringify(leads, null, 1));
fs.writeFileSync("swarm/_closer_cycle.json", JSON.stringify({ considered: fresh.length, drafts: log.skipped.filter(r => r.draft && /draft-only/.test(r.why)).length, sent: log.replies.filter(r => r.at.slice(0, 10) === today && r.status === "sent").length, cap: CAP, latest: log.replies.slice(-3) }));
