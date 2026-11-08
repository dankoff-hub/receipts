#!/usr/bin/env node
// Finds free distribution doors. Never submits, never creates an account, never pays.
// A door is sendable only if the page says no account, and does not require a card or a badge.
import fs from "node:fs";

const DOORS = [
  { name: "SaaSLineup", url: "https://saaslineup.com/submit", kind: "directory" },
  { name: "TheSaaSDir", url: "https://thesaasdir.com/submit", kind: "directory" },
  { name: "PublishYourSaaS", url: "https://publishyoursaas.com/submit", kind: "directory" },
];
const BSKY = "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=" + encodeURIComponent("discipline starter pack") + "&limit=5";
const OUT = "content/distribution-queue.json";
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { doors: [], listens: [] };

function classify(text) {
  const t = text.toLowerCase();
  const noAccount = /no account needed|without creating an account|no account required/.test(t);
  const card = /credit card|\$\d|pricing|one-time|paid plan|payment/.test(t);
  const badge = /badge required|must (add|show) the badge|badge html/.test(t);
  const plan = /select(ed)? plan|starter and advanced|featured/.test(t);
  return {
    no_account: noAccount,
    card_or_price_mentioned: card,
    badge_required: badge,
    plan_choice: plan,
    sendable: noAccount && !card && !badge && !plan,
  };
}

const doors = [];
for (const d of DOORS) {
  try {
    const r = await fetch(d.url, { headers: { "user-agent": "ReceiptsScout/1.0" } });
    const text = await r.text();
    const c = classify(text.slice(0, 20000));
    doors.push({ ...d, status: r.status, checked: new Date().toISOString(), ...c, action: c.sendable ? "ready-for-human-or-later-bot" : "skip — account, card, badge, or plan" });
  } catch (e) {
    doors.push({ ...d, status: 0, error: String(e.message || e).slice(0, 120), sendable: false, action: "skip — fetch failed" });
  }
}

let listens = prev.listens || [];
try {
  const j = await (await fetch(BSKY)).json();
  const fresh = (j.posts || []).map((p) => ({
    uri: p.uri,
    text: String(p.record?.text || "").slice(0, 180),
    at: p.indexedAt,
  })).filter((p) => p.text && !/https?:|\$\d|guarantee|refund/.test(p.text));
  const seen = new Set(listens.map((x) => x.uri));
  listens = [...fresh.filter((p) => !seen.has(p.uri)), ...listens].slice(0, 20);
} catch (e) {
  listens = [{ error: String(e.message || e).slice(0, 120) }, ...listens].slice(0, 20);
}

const queue = {
  updated: new Date().toISOString(),
  rule: "Do not submit. Do not reply. Substack stays at 0. IG/YouTube/TikTok caps stay at 8. A door is sendable only with no account, no card, no badge, no plan picker.",
  sendable: doors.filter((d) => d.sendable).length,
  doors,
  listens,
};
fs.writeFileSync(OUT, JSON.stringify(queue, null, 1) + "\n");
console.log(JSON.stringify({ sendable: queue.sendable, doors: doors.map((d) => [d.name, d.sendable, d.action]), listens: listens.length }));
