#!/usr/bin/env node
// Post today's script to a Skool community via Skool's internal write API (api2.skool.com).
// Requires env:
//   SKOOL_COOKIES  - session cookies string (auth_token=...; client_id=...; aws-waf-token=...)
//   SKOOL_GROUP    - community slug, e.g. "prove-them-wrong"
//   SKOOL_LABEL_ID - category/label id (required if the community has categories)
// Exits 0 silently when not configured, so the workflow stays green until Skool is set up.
import fs from "node:fs";

const COOKIES = process.env.SKOOL_COOKIES;
const GROUP = process.env.SKOOL_GROUP;
const LABEL = process.env.SKOOL_LABEL_ID || "";
const SITE = process.env.APP_URL || "https://receipts-blond.vercel.app";

if (!COOKIES || !GROUP) { console.log("skool: not configured — skip"); process.exit(0); }

// Build post from today's script (same source as the daily video)
const day = Number(process.argv[2] ?? 0);
const md = fs.readFileSync("content/launch-scripts.md", "utf8");
const S = [...md.matchAll(/## (\d+)\. (.+)\n- Hook[^\n]*\n- Say: (.+)\n- Body: (.+)\n- CTA: (.+)/g)]
  .map(m => ({ n: +m[1], hook: m[2], say: m[3], body: m[4], cta: m[5] }));
const s = S[day % S.length];

const title = `Day ${day + 1}: ${s.hook}`.slice(0, 100);
const content = [
  s.say,
  "",
  s.body,
  "",
  `The full 30-day Receipts system is $29: ${SITE}/bio`,
].join("\n");

const headers = {
  "Content-Type": "application/json",
  "Cookie": COOKIES,
  "Origin": "https://www.skool.com",
  "Referer": `https://www.skool.com/${GROUP}`,
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
};

// Create post; labelId is only sent when provided.
const body = { md: content, title, group: GROUP };
if (LABEL) body.labelId = LABEL;

const r = await fetch("https://api2.skool.com/posts", {
  method: "POST", headers, body: JSON.stringify(body),
});
const text = await r.text();
if (!r.ok) {
  // Most common failure: stale cookies (they live ~3-4 days). Fail loudly so the brief flags it.
  console.error("skool: post failed", r.status, text.slice(0, 300));
  process.exit(1);
}
console.log("skool:", text.slice(0, 300));
