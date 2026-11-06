// Revenue Hunter — scans public, keyless sources for high-intent posts; rule-tiers first, LLM only for ambiguous ones.
// Sources: Bluesky public search, Lemmy search, Mastodon tags (all read-only, keyless) + Cloudflare worker leads. Writes swarm/LEADS.json.
import fs from "node:fs";
import { chat, parseJSON, saveQuota } from "./llm.mjs";
process.on("exit", () => saveQuota());
const QUERIES = ["30 day challenge tracker template", "prove them wrong 30 days", "accountability tracker printable", "someone said I couldn't", "habit tracker pdf where to buy", "daily proof journal", "spite motivation 30 days"];
const T1 = /\b(where (can|do) i (buy|get|find)( a| the)? (tracker|template|planner|journal|pdf|system)|(drop|send|share) (me )?(the|a) link|link please|is there a (template|tracker|pdf|printable)|how much (is|does|for)( a| the)? (tracker|template|planner|journal)|worth buying|recommend(ation)?s? for (a |an )?(tracker|template|planner|journal|accountability)|take my money|looking for (a |an )?(habit |accountability |30[- ]day )?(tracker|template|system|planner|journal))\b/i;
const T2 = /\b(start(ing)? (a )?30[- ]day|accountab|track(ing)? (my )?progress|prove (them|him|her|everyone) wrong|told me i (couldn'?t|wasn'?t)|habit tracker|daily proof|streak)\b/i;
const LEADS_P = "swarm/LEADS.json"; const leads = fs.existsSync(LEADS_P) ? JSON.parse(fs.readFileSync(LEADS_P, "utf8")) : { seen: [], leads: [] };
const UA = { "User-Agent": "receipts-swarm/1.0 (read-only research)" };
const items = [];
const push = (o) => { if (o.text) items.push(o); };
// Reddit excluded: Data API needs explicit Reddit approval (written approval for commercial use) — founder-only request; see DIRECTIVE.md "Reddit gate".
for (const q of QUERIES) {
  try { const r = await fetch(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=25&sort=latest`, { headers: UA }); if (!r.ok) console.error(`bluesky HTTP ${r.status}`); const j = await r.json();
    for (const p of j?.posts || []) { const hnd = p.author?.handle, rk = p.uri?.split("/").pop(); push({ src: "bluesky", id: p.uri, url: `https://bsky.app/profile/${hnd}/post/${rk}`, text: String(p.record?.text || "").slice(0, 600), sub: hnd, at: p.record?.createdAt }); } } catch (e) { console.error("bluesky err", e.message); }
  try { const r = await fetch(`https://lemmy.world/api/v3/search?q=${encodeURIComponent(q)}&type_=Posts&limit=20&sort=New`, { headers: UA }); if (!r.ok) console.error(`lemmy HTTP ${r.status}`); const j = await r.json();
    for (const p of j?.posts || []) { const d = p.post; push({ src: "lemmy", id: "lemmy:" + d.id, url: d.ap_id, text: `${d.name} ${d.body || ""}`.slice(0, 600), sub: p.community?.name, at: d.published }); } } catch (e) { console.error("lemmy err", e.message); }
}
for (const tag of ["habittracker", "30daychallenge", "selfimprovement", "discipline", "journaling", "provethemwrong"]) {
  try { const r = await fetch(`https://mastodon.social/api/v1/timelines/tag/${tag}?limit=40`, { headers: UA }); if (!r.ok) console.error(`mastodon HTTP ${r.status}`); const j = await r.json();
    for (const p of Array.isArray(j) ? j : []) push({ src: "mastodon", id: "masto:" + p.id, url: p.url, text: String(p.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600), sub: p.account?.acct, at: p.created_at }); } catch (e) { console.error("mastodon err", e.message); }
}
// Cloudflare Worker hunter (cloudflare/src/worker.js) scans every 2h from Cloudflare's network — merge its leads.
if (process.env.SWARM_WORKER_URL) {
  try { const r = await fetch(process.env.SWARM_WORKER_URL.replace(/\/$/, "") + "/leads", { headers: UA }); const j = await r.json();
    let m = 0; for (const l of j.leads || []) { if (!leads.seen.includes(l.id) && !items.some(x => x.id === l.id)) { items.push({ src: "cf:" + l.src, id: l.id, url: l.url, text: l.text, at: l.at }); m++; } } console.log(`worker leads merged: ${m}`); } catch (e) { console.error("worker leads err", e.message); }
}
const fresh = items.filter((x, i, a) => x.text && a.findIndex(y => y.id === x.id) === i && !leads.seen.includes(x.id));
let llmCalls = 0, tiered = [];
for (const it of fresh) {
  let tier = T1.test(it.text) ? 1 : T2.test(it.text) ? 2 : 0;
  if (tier === 0 && llmCalls < 6 && /30|track|prove|doubt|accountab/i.test(it.text)) {
    llmCalls++;
    const r = await chat(`Classify buying intent for a $29 "30-day proof/accountability system" PDF. Post: """${it.text}""". Reply JSON {"tier":1|2|3,"why":"<8 words"}. 1=asks for product/link/price, 2=starting a 30-day/accountability effort, 3=unrelated.`, { maxTokens: 40 });
    const j = parseJSON(r.text); tier = j?.tier === 1 && T2.test(it.text) ? 1 : j?.tier === 1 || j?.tier === 2 ? 2 : 3; it.llm = r.provider; // LLM alone can only reach tier 2
  }
  if (tier === 0) tier = 3;
  leads.seen.push(it.id);
  if (tier <= 2) tiered.push({ ...it, tier, found: new Date().toISOString(), status: "new" });
}
// re-tier older leads with the current rules (classification tightened over time)
for (const l of leads.leads) { if (l.tier === 1 && !T1.test(l.text)) l.tier = T2.test(l.text) ? 2 : 3; }
leads.leads = leads.leads.filter(l => l.tier <= 2);
leads.seen = leads.seen.slice(-5000);
leads.leads = [...tiered, ...leads.leads].slice(0, 400);
fs.writeFileSync(LEADS_P, JSON.stringify(leads, null, 1));
const t1 = tiered.filter(l => l.tier === 1), t2 = tiered.filter(l => l.tier === 2);
fs.writeFileSync("swarm/_hunter_cycle.json", JSON.stringify({ scanned: fresh.length, tier1: t1.length, tier2: t2.length, llmCalls, top: [...t1, ...t2].slice(0, 8).map(l => ({ tier: l.tier, src: l.src, url: l.url, text: l.text.slice(0, 140) })) }));
console.log(`hunter: scanned ${fresh.length} new posts → tier1 ${t1.length}, tier2 ${t2.length} (llm calls ${llmCalls})`);
