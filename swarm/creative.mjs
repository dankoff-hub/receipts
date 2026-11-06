// Creative Provocateur — ≥3 divergent concepts/platform/day, anti-repetition via hash ledgers, blacklist of dead formats.
// Output: swarm/CONCEPTS.json (all) + content/swarm-scripts.md (video-ready scripts that make-video.py publishes FIRST).
import fs from "node:fs";
import crypto from "node:crypto";
import { chat, parseJSON } from "./llm.mjs";
const today = new Date().toISOString().slice(0, 10);
const CP = "swarm/CONCEPTS.json"; const C = fs.existsSync(CP) ? JSON.parse(fs.readFileSync(CP, "utf8")) : { days: {}, hooks: [] };
if (C.days[today]?.length >= 9) { console.log("creative: today already done"); process.exit(0); }
const mem = fs.readFileSync("swarm/MEMORY.md", "utf8");
const black = [...mem.matchAll(/^- blacklist: (.+)$/gm)].map(m => m[1]);
const hunter = (() => { try { return JSON.parse(fs.readFileSync("swarm/_hunter_cycle.json", "utf8")); } catch { return {}; } })();
const pains = (hunter.top || []).map(t => t.text).slice(0, 4).join(" | ");
const md5 = s => crypto.createHash("md5").update(s).digest("hex");
const ledger = new Set([...(JSON.parse(fs.readFileSync("content/script-ledger.json", "utf8")).used || []), ...C.hooks]);
const sys = "You write platform-native short-form concepts for Receipts Pack: a $29 one-time 30-day system that turns a moment of doubt ('they said you couldn't') into one measurable standard and 30 days of proof. Dark-motivation, calm, no hype. JSON only.";
const prompt = `Date ${today}. Platforms: instagram, youtube, tiktok. For EACH platform give 3 DIVERGENT concepts (different format: e.g. POV story, list, confession, challenge, myth-bust, receipt reveal). Avoid formats: ${black.join("; ") || "none"}. Real audience pains seen today: ${pains || "n/a"}.
Return {"concepts":[{"platform":"instagram","format":"...","hook":"<=12 words, first 2s","say":"3-4 short spoken sentences","body":"1 sentence lesson","cta":"end line mentioning $29 link in bio"}]} with exactly 9 items. Every hook must be unique and not start with 'They said'.`;
const r = await chat(prompt, { system: sys, maxTokens: 1400 });
let concepts = parseJSON(r.text)?.concepts;
if (!Array.isArray(concepts) || concepts.length < 3) { // deterministic fallback — combinatorial, still unique
  const seeds = ["The coworker who laughed when I asked for the raise", "My own voice note from day zero", "The rejection email I printed", "The gym buddy who quit on day 4", "The landlord who wanted proof of income", "The 'we went another direction' call", "The family dinner question", "The 2am screenshot", "The unanswered application"];
  const formats = ["POV story", "receipt reveal", "3-rule list", "confession", "myth-bust", "day-7 check-in", "challenge", "before/after", "quiet flex"];
  concepts = seeds.map((s, i) => ({ platform: ["instagram", "youtube", "tiktok"][i % 3], format: formats[i], hook: `${s}. I kept the receipt.`, say: `I stopped arguing and started measuring. One standard, written down, checked daily. Day ${7 + i * 3} the streak said more than I ever could. Nobody debates a streak.`, body: "Turn one moment of doubt into one measurable standard and collect daily proof for 30 days.", cta: "The 30-day Receipts system is $29 — link in bio." }));
}
concepts = concepts.filter(c => c.hook && c.say && !ledger.has(md5(c.hook + "|" + c.say)) && !/^they said/i.test(c.hook)).slice(0, 9);
C.days[today] = concepts.map(c => ({ ...c, provider: r.provider, id: md5(c.hook + "|" + c.say) }));
C.hooks.push(...C.days[today].map(c => c.id)); C.hooks = C.hooks.slice(-2000);
fs.writeFileSync(CP, JSON.stringify(C, null, 1));
// video-ready scripts → consumed first by make-video.py (never repeated: script-ledger)
const SP = "content/swarm-scripts.md"; const ex = fs.existsSync(SP) ? fs.readFileSync(SP, "utf8") : "# Swarm scripts (priority queue for daily videos)\n";
let n = Math.max(1000, ...[...ex.matchAll(/## (\d+)\./g)].map(m => +m[1])) + 1;
const add = concepts.map(c => `\n## ${n++}. ${c.hook.replace(/[.!?]+$/, "")} [${c.platform}/${c.format}]\n- Hook: ${c.hook}\n- Say: ${c.say.replace(/\n+/g, " ")}\n- Body: ${c.body.replace(/\n+/g, " ")}\n- CTA: ${c.cta.replace(/\n+/g, " ")}\n`).join("");
fs.writeFileSync(SP, ex + add);
console.log(`creative: ${concepts.length} concepts via ${r.provider} → content/swarm-scripts.md (+${concepts.length})`);
