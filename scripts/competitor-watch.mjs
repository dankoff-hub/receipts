#!/usr/bin/env node
// Agent 6 - COMPETITOR WATCH: monitors free public sources for rival motivation products
// and pricing moves, so our content can counter-position. Writes content/competitor-watch.json.
const QUERIES = ["30 day challenge product", "accountability app", "discipline course", "dopamine detox program", "habit tracker paid"];
const hits = [];
for (const q of QUERIES) {
  try {
    const r = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=6`);
    if (!r.ok) continue;
    const j = await r.json();
    for (const h of j.hits || []) hits.push({ q, title: h.title, points: h.points, url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}` });
  } catch {}
  await new Promise(r => setTimeout(r, 800));
}
hits.sort((a, b) => (b.points || 0) - (a.points || 0));
const fs = await import("node:fs");
fs.writeFileSync("content/competitor-watch.json", JSON.stringify({ at: new Date().toISOString(), hits: hits.slice(0, 15) }, null, 2));
console.log(`COMPETITOR WATCH: ${hits.length} signals logged`);
