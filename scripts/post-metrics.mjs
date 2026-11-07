#!/usr/bin/env node
// Daily: pull per-post metrics from Buffer (views, reach, saves, shares, avg watch) for IG + YT (+TikTok),
// join to our videos via post-log, write content/post-metrics.json, update strategy-brief.performance
// (channel medians, top/bottom hooks, breakouts >= 3x median) and content/audience-scoreboard.json.
import fs from "node:fs";
const KEY = process.env.BUFFER_API_KEY;
const gql = async q => { const j = await (await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query: q }) })).json(); return j.data; };
const load = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };
const o = (await gql(`{account{organizations{id}}}`)).account.organizations[0].id;
const edges = (await gql(`{posts(first:100,input:{organizationId:"${o}",filter:{status:[sent]},sort:[{field:createdAt,direction:desc}]}){edges{node{id channelService sentAt externalLink metricsUpdatedAt metrics{name value}}}}}`)).posts.edges;
const log = load("content/post-log.json", []);
const byId = Object.fromEntries(log.filter(p => p.postId).map(p => [p.postId, p]));
const rows = edges.map(({ node: n }) => {
  const m = Object.fromEntries((n.metrics || []).map(x => [x.name, x.value]));
  const lp = byId[n.id] || {};
  const meta = lp.video ? load(`public/videos/${lp.video}.json`, {}) : {};
  return { postId: n.id, channel: n.channelService, sentAt: n.sentAt, link: n.externalLink, video: lp.video || null, hook: meta.hook || null,
    views: m["Video Views"] ?? m["Views"] ?? null, reach: m["Reach"] ?? null, saves: m["Saves"] ?? null, shares: m["Shares"] ?? null,
    likes: m["Reactions"] ?? null, comments: m["Comments"] ?? null, avgWatch: m["Avg. Watch Time (sec)"] ?? null, metricsAt: n.metricsUpdatedAt };
});
fs.writeFileSync("content/post-metrics.json", JSON.stringify({ updated: new Date().toISOString(), posts: rows }, null, 1));
const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const perf = {};
for (const ch of ["instagram", "youtube", "tiktok"]) {
  const r = rows.filter(x => x.channel === ch && x.sentAt && Date.now() - Date.parse(x.sentAt) > 12 * 3600e3); // let metrics settle 12h
  const medViews = med(r.map(x => x.views));
  const ranked = r.filter(x => x.views != null).sort((a, b) => b.views - a.views);
  perf[ch] = { posts: r.length, medianViews: medViews, medianAvgWatch: med(r.map(x => x.avgWatch)),
    top: ranked.slice(0, 3).map(x => ({ hook: x.hook, views: x.views, avgWatch: x.avgWatch, video: x.video })),
    bottom: ranked.slice(-3).map(x => ({ hook: x.hook, views: x.views, video: x.video })),
    breakouts: medViews ? ranked.filter(x => x.views >= 3 * Math.max(medViews, 20)).map(x => ({ hook: x.hook, views: x.views, video: x.video })) : [] };
}
// ---- video-variant experiment (voice / music / background): relative index = views / channel median, pooled across channels
const polP = "content/variant-policy.json"; const pol = load(polP, { weights: {}, min_posts_per_level: 6, floor: 0.1, history: [] });
const chMed = Object.fromEntries(Object.entries(perf).map(([c, p]) => [c, Math.max(p.medianViews || 0, 1)]));
const settled = rows.filter(x => x.video && x.views != null && x.sentAt && Date.now() - Date.parse(x.sentAt) > 12 * 3600e3 && chMed[x.channel]);
const exp = {}; const applied = [];
for (const factor of ["voice", "music", "bg", "cta"]) {
  const lv = {};
  for (const r of settled) { const v = load(`public/videos/${r.video}.json`, {}).variant; const l = v && v[factor]; if (!l) continue;
    (lv[l] = lv[l] || { n: 0, idx: [], watch: [] }); lv[l].n++; lv[l].idx.push(r.views / chMed[r.channel]); if (r.avgWatch != null) lv[l].watch.push(r.avgWatch); }
  const summary = Object.fromEntries(Object.entries(lv).map(([l, o]) => [l, { posts: o.n, rel_views: +med(o.idx)?.toFixed(2), avg_watch: med(o.watch) }]));
  exp[factor] = summary;
  const w = pol.weights?.[factor]; if (!w) continue;
  const ready = Object.keys(w).every(l => (lv[l]?.n || 0) >= (pol.min_posts_per_level || 6));
  if (!ready) continue;
  const raw = Object.fromEntries(Object.keys(w).map(l => [l, Math.max(0.05, med(lv[l].idx) || 0.05)])); const tot = Object.values(raw).reduce((a, b) => a + b, 0);
  let nw = Object.fromEntries(Object.keys(w).map(l => [l, 0.5 * w[l] + 0.5 * raw[l] / tot]));
  const fl = pol.floor || 0.1; nw = Object.fromEntries(Object.entries(nw).map(([l, x]) => [l, Math.max(fl, x)])); const t2 = Object.values(nw).reduce((a, b) => a + b, 0);
  nw = Object.fromEntries(Object.entries(nw).map(([l, x]) => [l, +(x / t2).toFixed(3)]));
  if (JSON.stringify(nw) !== JSON.stringify(w)) { pol.weights[factor] = nw; applied.push({ factor, from: w, to: nw, evidence: summary }); }
}
if (applied.length) { pol.history = [...(pol.history || []), { at: new Date().toISOString(), applied }].slice(-30); }
pol.updated = new Date().toISOString(); pol.last_evidence = exp; fs.writeFileSync(polP, JSON.stringify(pol, null, 1));
console.log("variant experiment:", JSON.stringify(exp), applied.length ? "→ weights updated" : "(not enough settled posts per level yet)");
const brief = load("content/strategy-brief.json", {});
brief.variant_experiment = { updated: new Date().toISOString(), evidence: exp, weights: pol.weights, applied_now: applied };
brief.performance = { updated: new Date().toISOString(), ...perf };
brief.breakout_hooks = [...new Set(Object.values(perf).flatMap(p => p.breakouts.map(b => b.hook)).filter(Boolean))];
fs.writeFileSync("content/strategy-brief.json", JSON.stringify(brief, null, 1));
// scoreboard for the audience bet (baseline 2026-11-06: YT 53 subs, IG ~0 reach, Shorts 0-7 views)
const sb = load("content/audience-scoreboard.json", { baseline: { date: "2026-11-06", youtube_subs: 53, youtube_median_views: 3, instagram_median_views: 0 }, history: [] });
const hist = load("content/audience-history.json", []);
const days = Array.isArray(hist) ? hist : (hist.days || []); const last = days[days.length - 1] || null;
sb.history.push({ date: new Date().toISOString().slice(0, 10), youtube_subs: last?.youtube?.subscribers ?? last?.youtube_subs ?? null,
  youtube_median_views: perf.youtube.medianViews, instagram_median_views: perf.instagram.medianViews, instagram_median_reach: med(rows.filter(x => x.channel === "instagram").map(x => x.reach)),
  posts_7d: rows.filter(x => Date.now() - Date.parse(x.sentAt) < 7 * 864e5).length });
fs.writeFileSync("content/audience-scoreboard.json", JSON.stringify(sb, null, 1));
console.log(JSON.stringify(perf, null, 1));
console.log("scoreboard:", JSON.stringify(sb.history[sb.history.length - 1]));
