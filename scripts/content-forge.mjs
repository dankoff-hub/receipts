#!/usr/bin/env node
// Content forge: generates new video script variants so daily posts don't go stale.
// Strategy: 1) GitHub Models free tier (GITHUB_TOKEN, zero cost) if reachable.
//           2) Combinatorial template generator as guaranteed fallback.
// Appends to content/forge-scripts.md in the exact launch-scripts.md format.
// Runs weekly via content-forge.yml; safe to re-run (appends, never rewrites).
import fs from "node:fs";
import { skillHint } from "../swarm/llm.mjs";

const FILE = "content/forge-scripts.md";
const COUNT = 40; // 4 videos + 1 carousel per day = 35 unique scripts/week
const existing = fs.existsSync(FILE) ? fs.readFileSync(FILE, "utf8") : "";
const startN = Math.max(30, ...[...existing.matchAll(/## (\d+)\./g)].map(m => +m[1])) + 1;

const FORMAT = `## <n>. <short title>
- Hook: <first 2 seconds, spoken + on-screen>
- Say: <3-5 short spoken sentences>
- Body: <the lesson, 1-2 sentences>
- CTA: <end line mentioning $29 link in bio>`;

async function llmScripts() {
  const tok = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!tok) throw new Error("no token");
  const brief = (() => { try { return JSON.parse(fs.readFileSync("content/strategy-brief.json", "utf8")); } catch { return {}; } })();
  const perf = brief.performance || {};
  const top = [...(perf.youtube?.top || []), ...(perf.instagram?.top || [])].filter(x => x.hook).map(x => `"${x.hook}" (${x.views} views, ${x.avgWatch ?? "?"}s avg watch)`).slice(0, 6);
  const bottom = [...(perf.youtube?.bottom || []), ...(perf.instagram?.bottom || [])].filter(x => x.hook).map(x => `"${x.hook}"`).slice(0, 4);
  const perfNote = top.length ? `\nPERFORMANCE DATA (real, from our channels): best hooks so far: ${top.join("; ")}. Worst: ${bottom.join("; ")}. Write hooks in the style of the best ones; the first 5 words must create an open loop or a specific concrete image (a name, a number, a place), never an abstract statement. Each script 15-25 seconds spoken.` : "";
  const mech = (() => { try { return JSON.parse(fs.readFileSync("content/product-mechanism.json", "utf8")); } catch { return {}; } })();
  const prompt = perfNote + `You write TikTok scripts for "Receipts Pack", a $29 one-time 30-day system. The method is one private receipt, then one if-then ("${mech.if_then || "If the old sentence shows up, then I do one counted action."}"), then ${mech.evening || "one line at night"}. Never name real people. Never claim a scientific guarantee, a refund, or income. B2C, spoken-word style, each 15-25s when read aloud. One action only: the free template, link in bio, not a second link. Vary the angles: investor rejection, boss doubt, ex, coach, family skepticism, being overlooked, being laughed at, being told to be realistic, gatekeepers, "who do you think you are". Output exactly ${COUNT} scripts, numbering from ${startN}, in this exact format (no other text):\n${FORMAT}\n` + [skillHint("social-short-form-video-script", 180), skillHint("social-tiktok-growth", 120), skillHint("social-instagram-growth", 120), skillHint("social-link-in-bio-and-traffic", 140), skillHint("marketing-social", 120), skillHint("content-repurposing", 100)].filter(Boolean).join("\n");
  const r = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
    body: JSON.stringify({ model: "openai/gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.9 }),
  });
  if (!r.ok) throw new Error("models api " + r.status);
  const j = await r.json();
  const text = j.choices?.[0]?.message?.content || "";
  const blocks = [...text.matchAll(/## (\d+)\. (.+)\n- Hook[^\n]*\n- Say: (.+)\n- Body: (.+)\n- CTA: (.+)/g)];
  if (blocks.length < 3) throw new Error("llm output not parseable");
  return blocks.map(m => `## ${m[1]}. ${m[2]}\n- Hook: ${m[3].replace(/^- Hook: ?/i, "")}\n- Say: ${m[4]}\n- Body: ${m[5]}\n- CTA: ${m[6]}`).join("\n\n");
}

function templateScripts() {
  const doubters = ["The investor who passed", "The boss who smirked", "The ex who laughed", "The coach who cut you", "The family member who said be realistic", "The friend who went quiet", "The gatekeeper who never replied", "The manager who said next year", "The group chat that went silent", "The mentor who said not yet"];
  const receipts = ["a screenshot you never deleted", "the email you read twice", "one sentence you wrote down", "a date you circled", "the voicemail you kept", "the rejection letter in your drawer", "a number you memorized", "the meeting notes you kept", "a text you screenshot at 2am", "the invoice of what it cost you"];
  const standards = ["5am starts for 30 days", "one outreach email a day", "10,000 words of proof", "30 days of published work", "one measurable rep before breakfast", "a daily score nobody can argue with", "30 logged workouts", "30 shipped pages", "one uncomfortable call a day", "a streak that outlives the doubt"];
  const closers = ["Not to send them. To prove it.", "Anger is fuel. Receipts are the engine.", "Doubt counted you out. Evidence counts you in.", "You don't argue. You accumulate.", "The receipt becomes the standard. The standard becomes the proof."];
  const out = [];
  for (let i = 0; i < COUNT; i++) {
    const d = doubters[(startN - 1 + i) % doubters.length], r = receipts[(startN - 1 + i) % receipts.length], st = standards[(startN - 1 + i) % standards.length], c = closers[(startN - 1 + i) % closers.length];
    const n = startN + i;
    out.push(`## ${n}. ${d}
- Hook: ${d}. So I kept the receipt.
- Say: ${c} If that sentence shows up again, then I do ${st}. One line at night. That is the whole system.
- Body: The receipt stays private. The if-then is the counted action. ${r.charAt(0).toUpperCase() + r.slice(1)} stays in the drawer. ${st} is what you can do tomorrow.
- CTA: Free template first — link in bio. The pack is $29, one time.`);
  }
  return out.join("\n\n");
}

let block, source;
try { block = await llmScripts(); source = "llm"; }
catch (e) { console.log("llm unavailable:", e.message, "— using templates"); block = templateScripts(); source = "templates"; }

fs.mkdirSync("content", { recursive: true });
fs.appendFileSync(FILE, (existing && !existing.endsWith("\n\n") ? "\n\n" : "") + block + "\n");
console.log(`forge: appended ${COUNT} scripts (${startN}–${startN + COUNT - 1}) via ${source}`);
