// Revenue Hunter — scans public, keyless sources for high-intent posts; rule-tiers first, LLM only for ambiguous ones.
// Sources: Reddit public search JSON, Bluesky public search (both read-only, no account). Writes swarm/LEADS.json.
import fs from "node:fs";
import { chat, parseJSON } from "./llm.mjs";
const QUERIES = ["30 day challenge tracker template", "prove them wrong 30 days", "accountability tracker printable", "someone said I couldn't", "habit tracker pdf where to buy", "daily proof journal", "spite motivation 30 days"];
const T1 = /\b(where (can|do) i (buy|get|find)|link\??|is there a (template|tracker|pdf)|how much|worth (it|buying)|recommend(ation)?s? for (a )?(tracker|template|planner)|take my money|looking for (a )?(tracker|template|system|planner))\b/i;
const T2 = /\b(start(ing)? (a )?30[- ]day|accountab|track(ing)? (my )?progress|prove (them|him|her|everyone) wrong|told me i (couldn'?t|wasn'?t)|habit tracker|daily proof|streak)\b/i;
const LEADS_P = "swarm/LEADS.json"; const leads = fs.existsSync(LEADS_P) ? JSON.parse(fs.readFileSync(LEADS_P, "utf8")) : { seen: [], leads: [] };
const UA = { "User-Agent": "receipts-swarm/1.0 (read-only research)" };
const items = [];
for (const q of QUERIES) {
  try { const r = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&t=week&limit=25`, { headers: UA }); const j = await r.json();
    for (const c of j?.data?.children || []) { const d = c.data; items.push({ src: "reddit", id: d.name, url: "https://reddit.com" + d.permalink, text: `${d.title} ${d.selftext || ""}`.slice(0, 600), sub: d.subreddit, at: new Date(d.created_utc * 1000).toISOString() }); } } catch {}
  try { const r = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=25&sort=latest`, { headers: UA }); const j = await r.json();
    for (const p of j?.posts || []) { const h = p.author?.handle, rk = p.uri?.split("/").pop(); items.push({ src: "bluesky", id: p.uri, url: `https://bsky.app/profile/${h}/post/${rk}`, text: String(p.record?.text || "").slice(0, 600), sub: h, at: p.record?.createdAt }); } } catch {}
}
const fresh = items.filter((x, i, a) => x.text && a.findIndex(y => y.id === x.id) === i && !leads.seen.includes(x.id));
let llmCalls = 0, tiered = [];
for (const it of fresh) {
  let tier = T1.test(it.text) ? 1 : T2.test(it.text) ? 2 : 0;
  if (tier === 0 && llmCalls < 6 && /30|track|prove|doubt|accountab/i.test(it.text)) {
    llmCalls++;
    const r = await chat(`Classify buying intent for a $29 "30-day proof/accountability system" PDF. Post: """${it.text}""". Reply JSON {"tier":1|2|3,"why":"<8 words"}. 1=asks for product/link/price, 2=starting a 30-day/accountability effort, 3=unrelated.`, { maxTokens: 40 });
    const j = parseJSON(r.text); tier = j?.tier === 1 || j?.tier === 2 ? j.tier : 3; it.llm = r.provider;
  }
  if (tier === 0) tier = 3;
  leads.seen.push(it.id);
  if (tier <= 2) tiered.push({ ...it, tier, found: new Date().toISOString(), status: "new" });
}
leads.seen = leads.seen.slice(-5000);
leads.leads = [...tiered, ...leads.leads].slice(0, 400);
fs.writeFileSync(LEADS_P, JSON.stringify(leads, null, 1));
const t1 = tiered.filter(l => l.tier === 1), t2 = tiered.filter(l => l.tier === 2);
fs.writeFileSync("swarm/_hunter_cycle.json", JSON.stringify({ scanned: fresh.length, tier1: t1.length, tier2: t2.length, llmCalls, top: [...t1, ...t2].slice(0, 8).map(l => ({ tier: l.tier, src: l.src, url: l.url, text: l.text.slice(0, 140) })) }));
console.log(`hunter: scanned ${fresh.length} new posts → tier1 ${t1.length}, tier2 ${t2.length} (llm calls ${llmCalls})`);
