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

// ---- 2026-11-07 founder directive: daily performance review — top/bottom yesterday + what to change tomorrow
// Written to content/performance-review.md and echoed; the audience issue links it.
try {
  const yest = new Date(Date.now() - 24 * 3600e3).toISOString().slice(0, 10);
  const recent = rows.filter(r => r.sentAt?.slice(0, 10) === yest && r.views != null).sort((a, b) => b.views - a.views);
  const watchMed = med(rows.filter(x => x.avgWatch != null && x.channel === "instagram").map(x => x.avgWatch)) || 0;
  const retention = recent.length ? Math.round(100 * (recent[0].avgWatch || 0) / (load(`public/videos/${recent[0].video}.json`, {}).duration || 15)) : null;
  const lines = [
    `# Performance review — ${yest}`,
    "",
    `- Posts measured: ${recent.length} | IG median watch yesterday: ${watchMed}s (target: >5s on a ~10s video)`,
    `- Best: ${recent[0] ? `${recent[0].hook} — ${recent[0].views} views, ${recent[0].avgWatch}s watch (${retention}% retention)` : "no data"}`,
    `- Worst: ${recent.at(-1) ? `${recent.at(-1).hook} — ${recent.at(-1).views} views` : "no data"}`,
    "",
    "## Tomorrow's changes (auto)",
    recent.length > 3 && recent[0].views >= 3 * Math.max(recent.at(-1).views, 1)
      ? `- The winning hook style ("${recent[0].hook?.slice(0, 40)}…") gets a sequel; the losing style ("${recent.at(-1).hook?.slice(0, 40)}…") is retired from new scripts.`
      : "- Sample too small to pick a winner — keep the daily-run spine identical and judge on the full week.",
    watchMed > 0 && watchMed < 3 ? "- IG watch time still under 3s: tomorrow's script must be under 10s spoken, hook card ≤1.3s, one ask." : "- IG watch time acceptable; no format change.",
    `- Run status: day ${Math.ceil((Date.now() - Date.parse("2026-11-07")) / 86400e3)} of the 30-day run spine.`,
  ];
  fs.writeFileSync("content/performance-review.md", lines.join("\n") + "\n");
  console.log("performance review written");
} catch (e) { console.log("performance review skipped:", e.message); }
