#!/usr/bin/env node
import fs from "node:fs";
const checks = [
  ["scripts/partner-drafts.mjs", "humanizer"],
  ["scripts/content-forge.mjs", "social-tiktok-growth"],
  ["scripts/content-forge.mjs", "social-link-in-bio-and-traffic"],
  ["scripts/repurpose-post.mjs", "product-mechanism.json"],
  ["swarm/closer.mjs", "marketing-community-marketing"],
  ["swarm/creative.mjs", "social-tiktok-growth"],
];
const missing = [];
for (const [file, needle] of checks) {
  if (!fs.existsSync(file) || !fs.readFileSync(file, "utf8").includes(needle)) missing.push(file);
}
if (!fs.existsSync("skills/receipts-distribution/SKILL.md")) missing.push("skills/receipts-distribution/SKILL.md");
if (missing.length) {
  console.log(missing.join("\n"));
  process.exit(1);
}
console.log("OK");
