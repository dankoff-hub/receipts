#!/usr/bin/env node
// Agent 7 - POOL GUARD: quality gate for the script pool produced by Forge/Alchemist.
// Flags weak entries (overlong hooks, duplicates, missing CTA markers) into
// content/pool-quarantine.json. Never deletes — the human decides. Agents respect quarantine.
import fs from "node:fs";

const files = ["content/launch-scripts.md", fs.existsSync("content/forge-scripts.md") ? "content/forge-scripts.md" : null].filter(Boolean);
let all = [];
for (const f of files) {
  const md = fs.readFileSync(f, "utf8");
  all.push(...[...md.matchAll(/## (\d+)\. (.+)\n- Hook[^:\n]*: ?"?([^"\n]+)"?\n- Say: (.+)\n- Body: (.+)\n- CTA: ?"?(.+?)"?\n/g)].map(m => ({ n: +m[1], title: m[2], hook: (m[3] || m[2]).trim(), say: m[4], body: m[5], cta: m[6], file: f })));
}
const seen = new Map(); const bad = [];
const ON_THEME = /receipt|standard|proof|doubt|reject|discipline|motivat|30.day|bio/i;
for (const s of all) {
  const reasons = [];
  const key = s.hook.toLowerCase().slice(0, 40);
  if (seen.has(key)) reasons.push("duplicate-hook");
  seen.set(key, s.n);
  if (s.hook.length > 160) reasons.push("hook-too-long");
  if (!/bio|29|link|buy|price/i.test(s.cta + s.say)) reasons.push("cta-missing-offer");
  if (!ON_THEME.test(s.hook + s.say + s.body)) reasons.push("off-theme");
  if (reasons.length) bad.push({ n: s.n, title: s.title, reasons, file: s.file });
}
fs.writeFileSync("content/pool-quarantine.json", JSON.stringify({ at: new Date().toISOString(), total: all.length, flagged: bad }, null, 2));
console.log(`POOL GUARD: ${all.length} scripts inspected, ${bad.length} flagged${bad.length ? ": " + bad.slice(0, 5).map(b => "#" + b.n + "(" + b.reasons.join(",") + ")").join(" ") : ""}`);
