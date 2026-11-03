#!/usr/bin/env node
// Virality swarm: 3 agents working the trend → hook → pool pipeline daily.
//   SCOUT   - reads rising/top posts from motivation subreddits (public JSON, no auth)
//   ALCHEMIST - converts trending themes into Receipts-style scripts
//   CURATOR - dedupes against existing pool, appends only fresh material
// Output: content/trending-themes.json + appended forge scripts + virality-output.json report.
import fs from "node:fs";
import crypto from "node:crypto";

const SUBS = ["GetMotivated", "selfimprovement", "decidingtobebetter", "careerguidance", "getdisciplined"];
const UA = { "User-Agent": "receipts-swarm/1.0 (content-research)" };

// --- AGENT 1: SCOUT -----------------------------------------------------------
async function scout() {
  const posts = [];
  for (const sub of SUBS) {
    for (const feed of ["top", "rising"]) {
      try {
        const r = await fetch(`https://www.reddit.com/r/${sub}/${feed}.json?limit=15&t=day`, { headers: UA });
        if (!r.ok) continue;
        const j = await r.json();
        for (const c of j.data?.children || []) {
          const p = c.data;
          if (p.stickied || p.over_18 || (p.score || 0) < 300) continue;
          posts.push({ sub, title: p.title, score: p.score, comments: p.num_comments, url: "https://reddit.com" + p.permalink });
        }
      } catch {}
    }
  }
  posts.sort((a, b) => b.score - a.score);
  return posts.slice(0, 20);
}

// --- AGENT 2: ALCHEMIST -------------------------------------------------------
function alchemize(posts, usedKeys) {
  const frames = [
    (t) => ({ hook: `Everyone is posting about: "${t}". Here's the part nobody says.`, angle: "contrarian-trend" }),
    (t) => ({ hook: `"${t}" — 4,000 people agree. Most will do nothing.`, angle: "inaction-gap" }),
    (t) => ({ hook: `The internet calls this wisdom: "${t}". I call it a receipt.`, angle: "reframe" }),
  ];
  return posts.slice(0, 6).map((p, i) => {
    const t = p.title.length > 90 ? p.title.slice(0, 87) + "…" : p.title;
    const f = frames[i % frames.length](t);
    return {
      key: crypto.createHash("md5").update(p.title).digest("hex").slice(0, 10),
      source: p, ...f,
      say: `That post has ${(p.score / 1000).toFixed(1)} thousand upvotes. Agreement is not action. One receipt, one measurable standard, thirty days of evidence. That is the difference between feeling motivated and becoming undeniable.`,
      body: `Trending theme converted into the Receipts method: the crowd's agreement is free — your daily proof is what compounds.`,
      cta: `The 30-day Receipts system is $29 — link in bio.`,
    };
  }).filter(x => !usedKeys.has(x.key));
}

// --- RUN ----------------------------------------------------------------------
const poolFile = "content/forge-scripts.md";
const existing = fs.existsSync(poolFile) ? fs.readFileSync(poolFile, "utf8") : "";
const stateFile = "content/virality-used.json";
const usedKeys = new Set(fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, "utf8")) : []);
const startN = Math.max(30, ...[...existing.matchAll(/## (\d+)\./g)].map(m => +m[1]), ...[...fs.readFileSync("content/launch-scripts.md","utf8").matchAll(/## (\d+)\./g)].map(m => +m[1])) + 1;

const trends = await scout();
console.log(`SCOUT: ${trends.length} trending posts across r/${SUBS.join(", r/")}`);
const fresh = alchemize(trends, usedKeys);
console.log(`ALCHEMIST: ${fresh.length} fresh trend scripts (${trends.length - fresh.length} already used)`);

if (fresh.length) {
  const block = fresh.map((x, i) => `## ${startN + i}. Trend: ${x.angle}
- Hook: ${x.hook}
- Say: ${x.say}
- Body: ${x.body}
- CTA: ${x.cta}`).join("\n\n");
  fs.appendFileSync(poolFile, (existing && !existing.endsWith("\n\n") ? "\n\n" : "") + block + "\n");
  fresh.forEach(x => usedKeys.add(x.key));
}
fs.writeFileSync(stateFile, JSON.stringify([...usedKeys].slice(-500)));
fs.writeFileSync("content/trending-themes.json", JSON.stringify({ at: new Date().toISOString(), trends, added: fresh.map(f => ({ title: f.source.title, score: f.source.score, angle: f.angle })) }, null, 2));
fs.writeFileSync("content/virality-output.json", JSON.stringify({ at: new Date().toISOString(), trendsFound: trends.length, scriptsAdded: fresh.length, topTrends: trends.slice(0, 5) }, null, 2));
console.log(`CURATOR: pool now at ${startN - 1 + fresh.length} scripts, ${usedKeys.size} trend keys tracked`);
