#!/usr/bin/env node
// Skool Scribe — prepares Skool-ready contributions for the FOUNDER to publish by hand. The swarm never touches skool.com:
// Skool's platform policy bans bots that post/comment/message and any scraping or automation requests (help.skool.com/article/179-platform-policy);
// its Terms §4 ban automated access and commercial solicitation of users (skool.com/legal?t=terms); owning a community needs a card ($9+/mo).
// → Critical tier (ToS). Output only: content/skool-queue.md (dated, never-repeated) — value-first posts and comment templates for free
//   30-day-challenge / habit communities (see docs/skool-playbook.md). No links inside posts; the free tracker lives in the profile bio.
import fs from "node:fs";
import crypto from "node:crypto";
import { chat, parseJSON, saveQuota, skillHint } from "./llm.mjs";
process.on("exit", () => saveQuota());
const today = new Date().toISOString().slice(0, 10);
const QP = "content/skool-queue.md"; let q = fs.existsSync(QP) ? fs.readFileSync(QP, "utf8") : "# Skool queue — human-published only (see docs/skool-playbook.md)\n";
if (q.includes(`## ${today}`)) { console.log("skool: today already prepared"); process.exit(0); }
const md5 = s => crypto.createHash("md5").update(s).digest("hex");
const used = new Set([...q.matchAll(/<!-- h:(\w+) -->/g)].map(m => m[1]));
const C = (() => { try { return JSON.parse(fs.readFileSync("swarm/CONCEPTS.json", "utf8")); } catch { return { days: {} }; } })();
const seed = (C.days[today] || Object.values(C.days).at(-1) || [])[Math.floor(Math.random() * 9)] || {};
const contexts = ["a free Skool community running a live 30-day challenge (members post daily check-ins)", "a free habits & journaling community (people share streaks and slips)", "a free discipline/self-improvement community (lots of 'day 1 again' posts)"];
const ctx = contexts[new Date().getUTCDate() % contexts.length];
const r = await chat(`You are Dan, a member (not a coach, not a seller) of ${ctx}. Write for a human to paste by hand. Rules: value first, zero links, zero product names, no "DM me", no hashtags, no emojis, sound like a real member sharing what worked. Theme to riff on (do not copy): "${seed.hook || "the day the doubt got loud"}" / "${seed.body || "one standard, checked daily, beats motivation"}".
Return JSON {"post":{"title":"<=60 chars","body":"120-180 words: a specific moment, the one standard you set, how the daily one-line log works, one question to the room"},
"comments":[{"on":"someone announcing day 1","text":"<=60 words"},{"on":"someone who broke a streak","text":"<=60 words"},{"on":"someone asking how to stay accountable","text":"<=60 words"}]}`, { system: "Output compact JSON only. " + skillHint("humanizer", 400), maxTokens: 700 });
const j = parseJSON(r.text);
if (!j?.post?.body) { console.log("skool: no draft (provider " + r.provider + ")"); process.exit(0); }
const h = md5(j.post.title + j.post.body); if (used.has(h)) { console.log("skool: duplicate — skipped"); process.exit(0); }
const bad = /https?:\/\/|\.com\b|\$\d|receipts pack|dm me|link in bio/i; const clean = s => String(s || "").replace(/#\w+/g, "").trim();
if (bad.test(j.post.body) || (j.comments || []).some(c => bad.test(c.text))) { console.log("skool: brand-safety reject"); process.exit(0); }
q += `\n## ${today} — for: ${ctx} <!-- h:${h} -->\n**Post title:** ${clean(j.post.title)}\n\n${clean(j.post.body)}\n\n**Comment templates**\n${(j.comments || []).map(c => `- On ${c.on}: ${clean(c.text)}`).join("\n")}\n\n_Rules: paste by hand, one post/week per community max, comments daily, no links (tracker is in your profile bio), never pitch. Provider: ${r.provider}._\n`;
fs.writeFileSync(QP, q); console.log("skool: prepared", today, "via", r.provider);
