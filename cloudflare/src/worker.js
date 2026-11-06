// Receipts Revenue Swarm — Cloudflare Worker (Free plan). Cron: Revenue Hunter intent scan on keyless public sources,
// rule-based tiering, state in KV. HTTP: /health, /leads, /report. No LLM here (10ms CPU budget) — LLM work runs in the
// GitHub Actions orchestrator, which merges /leads each cycle. Zero cost: Workers Free + KV Free.
const QUERIES = ["30 day challenge tracker template", "prove them wrong 30 days", "accountability tracker printable", "someone said I couldn't", "habit tracker pdf where to buy", "daily proof journal", "spite motivation 30 days"];
const TAGS = ["habittracker", "30daychallenge", "selfimprovement", "discipline", "journaling", "provethemwrong"];
const T1 = /\b(where (can|do) i (buy|get|find)( a| the)? (tracker|template|planner|journal|pdf|system)|(drop|send|share) (me )?(the|a) link|link please|is there a (template|tracker|pdf|printable)|how much (is|does|for)( a| the)? (tracker|template|planner|journal)|worth buying|recommend(ation)?s? for (a |an )?(tracker|template|planner|journal|accountability)|take my money|looking for (a |an )?(habit |accountability |30[- ]day )?(tracker|template|system|planner|journal))\b/i;
const T2 = /\b(start(ing)? (a )?30[- ]day|accountab|track(ing)? (my )?progress|prove (them|him|her|everyone) wrong|told me i (couldn'?t|wasn'?t)|habit tracker|daily proof|streak)\b/i;
const UA = { "User-Agent": "Mozilla/5.0 receipts-swarm/1.0 (read-only research)" };
const j = async (u) => { const r = await fetch(u, { headers: UA }); return { ok: r.ok, status: r.status, body: r.ok ? await r.json() : null }; };

async function scan(env) {
  const items = [], src = {};
  const push = (o) => { if (o.text) items.push(o); };
  for (const q of QUERIES) {
    const b = await j(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=25&sort=latest`).catch(() => ({ status: 0 })); src.bluesky = b.status;
    for (const p of b.body?.posts || []) push({ src: "bluesky", id: p.uri, url: `https://bsky.app/profile/${p.author?.handle}/post/${p.uri?.split("/").pop()}`, text: String(p.record?.text || "").slice(0, 600), at: p.record?.createdAt });
    const r = await j(`https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&t=week&limit=25`).catch(() => ({ status: 0 })); src.reddit = r.status;
    for (const c of r.body?.data?.children || []) { const d = c.data; push({ src: "reddit", id: d.name, url: "https://reddit.com" + d.permalink, text: `${d.title} ${d.selftext || ""}`.slice(0, 600), at: new Date(d.created_utc * 1000).toISOString() }); }
    const l = await j(`https://lemmy.world/api/v3/search?q=${encodeURIComponent(q)}&type_=Posts&limit=20&sort=New`).catch(() => ({ status: 0 })); src.lemmy = l.status;
    for (const p of l.body?.posts || []) push({ src: "lemmy", id: "lemmy:" + p.post.id, url: p.post.ap_id, text: `${p.post.name} ${p.post.body || ""}`.slice(0, 600), at: p.post.published });
  }
  for (const t of TAGS) {
    const m = await j(`https://mastodon.social/api/v1/timelines/tag/${t}?limit=40`).catch(() => ({ status: 0 })); src.mastodon = m.status;
    for (const p of Array.isArray(m.body) ? m.body : []) push({ src: "mastodon", id: "masto:" + p.id, url: p.url, text: String(p.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600), at: p.created_at });
  }
  const seen = new Set(JSON.parse((await env.SWARM_KV.get("seen")) || "[]"));
  const leads = JSON.parse((await env.SWARM_KV.get("leads")) || "[]");
  let n = 0, t1 = 0, t2 = 0;
  for (const it of items) {
    if (seen.has(it.id)) continue; seen.add(it.id); n++;
    const tier = T1.test(it.text) ? 1 : T2.test(it.text) ? 2 : 3;
    if (tier === 1) t1++; if (tier === 2) t2++;
    if (tier <= 2) leads.unshift({ ...it, tier, found: new Date().toISOString(), status: "new" });
  }
  await env.SWARM_KV.put("seen", JSON.stringify([...seen].slice(-6000)));
  await env.SWARM_KV.put("leads", JSON.stringify(leads.slice(0, 500)));
  const report = { at: new Date().toISOString(), scanned_new: n, tier1: t1, tier2: t2, sources: src, total_leads: leads.length };
  await env.SWARM_KV.put("report", JSON.stringify(report));
  return report;
}

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(scan(env)); },
  async fetch(req, env) {
    const u = new URL(req.url);
    const json = (o, s = 200) => new Response(JSON.stringify(o, null, 1), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
    if (u.pathname === "/health") return json({ ok: true, worker: "receipts-swarm", report: JSON.parse((await env.SWARM_KV.get("report")) || "null") });
    if (u.pathname === "/leads") return json({ leads: JSON.parse((await env.SWARM_KV.get("leads")) || "[]") });
    if (u.pathname === "/report") return json(JSON.parse((await env.SWARM_KV.get("report")) || "{}"));
    if (u.pathname === "/scan" && req.headers.get("x-swarm-key") && req.headers.get("x-swarm-key") === env.SWARM_KEY) return json(await scan(env));
    return json({ ok: true, endpoints: ["/health", "/leads", "/report"] });
  },
};
