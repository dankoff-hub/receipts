#!/usr/bin/env node
// Deterministic SEO page generator. No API key required.
// Optional: if GROQ_API_KEY is set, one paragraph may be lightly rewritten.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kwPath = path.join(root, "content/seo-keywords.json");
const pagesPath = path.join(root, "content/seo-pages.json");
const CAP = Number(process.env.SEO_CAP || 6);
const BAN = /guarantee|refund|money-back|earn \$|make \$|income|therapy|cure/i;
function skillBit() {
  try {
    const t = fs.readFileSync(path.join(root, "skills/seo-programmatic/SKILL.md"), "utf8").replace(/^---[\s\S]*?---\s*/, "");
    const i = t.toLowerCase().indexOf("thin");
    return (i >= 0 ? t.slice(i, i + 220) : t.slice(0, 180)).replace(/\s+/g, " ");
  } catch { return "Unique page per query. No doorway clones."; }
}

const STEPS = [
  [
    "Write the no in one line: what you asked, and what came back.",
    "Name one standard you can keep on a minimum day.",
    "Log one proof today, then repeat that check for 30 days.",
  ],
  [
    "File the date, the ask, and the reply in a private note.",
    "Pick a behavior you control, not a reply you hope for.",
    "Review the log once a week and keep the same standard.",
  ],
  [
    "Separate the letter from the next action before you reread it.",
    "Write the smallest proof that still counts when you are tired.",
    "Do that proof today and date it. Missing a day does not erase the log.",
  ],
];

const FAQS = [
  [
    ["What is a proof in this guide?", "A proof is a dated note that the standard happened: a draft, a send, a practice block, or a one-line log."],
    ["Do I need the paid pack to start?", "No. Step 1, the private receipt log, is free. The pack adds the converter, the 30-day plan, and the arrival check."],
  ],
  [
    ["How long should this take each day?", "A minimum day can be a few minutes. The point is a dated proof, not a long session."],
    ["Is this a public journal?", "No. Keep the log private. These guides only describe the format."],
  ],
  [
    ["What if I miss a day?", "Write the next proof anyway. A missed day is a blank line, not a reason to drop the standard."],
    ["What does Receipts Pack include?", "A private receipt log, a rejection-to-standard converter, a 30-day proof plan, an arrival check, and printable worksheets. One payment, $29."],
  ],
];

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function hash(s) {
  let n = 0;
  for (const c of s) n = (n + c.charCodeAt(0) * 17) % 997;
  return n;
}

function relatedSlugs(slug, list, live) {
  const pool = list.map((k) => k.slug).filter((s) => s !== slug && live.has(s));
  const i = list.findIndex((k) => k.slug === slug);
  const out = [];
  for (let n = 1; out.length < 2 && n < list.length + 1; n++) {
    const s = list[(i + n) % list.length].slug;
    if (pool.includes(s) && !out.includes(s)) out.push(s);
  }
  for (const s of pool) if (out.length < 2 && !out.includes(s)) out.push(s);
  return out;
}

function clip(s, n) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).replace(/\s+\S*$/, "").replace(/[.,;:]$/, "") + ".";
}

function buildPage(k, list, live) {
  const h = hash(k.slug);
  const steps = STEPS[h % STEPS.length];
  const faq = FAQS[h % FAQS.length].map(([q, a]) => ({ q, a }));
  const opens = [
    `${k.audience} often look up “${k.query}” when the next move is unclear.`,
    `After a no, “${k.query}” is the search ${k.audience.toLowerCase()} type before they decide what to do tomorrow.`,
    `“${k.query}” is a planning search, not a mood. ${k.audience} can use it as a private log, not a public post.`,
  ];
  const middles = [
    `Write the ask, the reply, and the date. That private receipt is free Step 1. Nobody else has to see “${k.query}.”`,
    `Keep “${k.query}” in a note only you open. Date the line. The free template is the same first step, with five questions instead of a blank page.`,
    `Do not turn “${k.query}” into a thread. File it once. The free receipt log is the container.`,
  ];
  const standards = [
    `${k.angle} A standard is a behavior you can do on a tired day. A dated proof is enough.`,
    `${k.angle} Skip the streak app if it makes you quit. One dated line still counts.`,
    `${k.angle} The standard has to be checkable without a reply from anyone else.`,
  ];
  const closes = [
    `Hold “${k.query}” for 30 days, then read the log once and pick the next standard. Printed worksheets are in the $29 pack if you want them.`,
    `Thirty days of “${k.query}” should end with a reread, not a speech. The $29 pack is the worksheets and the arrival check, not a subscription.`,
    `When the month of “${k.query}” ends, keep the standard that still fits. The $29 pack adds the printed plan if the note is not enough.`,
  ];
  const paragraphs = [opens[h % 3], middles[h % 3], standards[h % 3], closes[h % 3]];
  const page = {
    slug: k.slug,
    query: k.query,
    title: clip(`${k.query} · Receipts`, 70),
    description: clip(`${k.angle} Free private receipt log, then a 30-day standard.`, 155),
    h1: k.query.charAt(0).toUpperCase() + k.query.slice(1),
    paragraphs,
    steps,
    faq,
    related: relatedSlugs(k.slug, list, live),
    cta: `/free?src=seo-${k.slug}`,
  };
  const blob = JSON.stringify(page);
  if (BAN.test(blob)) throw new Error(`ban list hit for ${k.slug}`);
  return page;
}

async function maybeEnrich(page) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return page;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Rewrite the user paragraph in under 40 words. Keep the search phrase. Each page must stay unique (seo-programmatic: no doorway duplicates, no thin clones). Do not use the words guarantee, refund, income, therapy, or cure. Do not mention money earned. Return only the paragraph. " + skillBit() },
          { role: "user", content: page.paragraphs[0] },
        ],
      }),
    });
    if (!res.ok) return page;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text || BAN.test(text) || text.length > 400) return page;
    page.paragraphs[0] = text;
  } catch {
    /* template stands */
  }
  return page;
}

const kw = loadJson(kwPath, { keywords: [] });
const list = Array.isArray(kw.keywords) ? kw.keywords : [];
const store = loadJson(pagesPath, { pages: {} });
if (!store.pages || typeof store.pages !== "object" || Array.isArray(store.pages)) store.pages = {};

let added = 0;
const live = new Set(Object.keys(store.pages));
const batch = [];
for (const k of list) {
  if (batch.length >= CAP) break;
  if (!k.slug || store.pages[k.slug]) continue;
  batch.push(k);
  live.add(k.slug);
}
for (const k of batch) {
  const page = await maybeEnrich(buildPage(k, list, live));
  store.pages[k.slug] = page;
  added++;
}
for (const slug of Object.keys(store.pages)) {
  const page = store.pages[slug];
  const next = relatedSlugs(slug, list, live);
  if (next.length === 2) page.related = next;
}

fs.writeFileSync(pagesPath, JSON.stringify(store, null, 2) + "\n");
console.log(`pages added: ${added}`);
