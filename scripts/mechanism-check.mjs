#!/usr/bin/env node
// Cross-check the if-then product change. Local files only. No network.
import fs from "node:fs";

const STRIPE = "https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
const BAN = /guarantee|refund|money-back|earn \$|make \$|income/i;
const pages = [
  "app/page.js",
  "app/free/page.js",
  "app/free/sheet/page.js",
  "app/bio/page.js",
  "app/guides/[slug]/page.js",
  "public/llms.txt",
];
const fail = [];
for (const f of pages) {
  if (!fs.existsSync(f)) { fail.push("missing " + f); continue; }
  const t = fs.readFileSync(f, "utf8");
  if (BAN.test(t)) fail.push("banned wording in " + f);
}
for (const f of ["app/page.js", "app/free/page.js", "app/bio/page.js", "app/pricing/page.js"]) {
  const t = fs.readFileSync(f, "utf8");
  if (!t.includes(STRIPE)) fail.push("stripe link changed or missing in " + f);
}
const mech = JSON.parse(fs.readFileSync("content/product-mechanism.json", "utf8"));
if (mech.stripe !== STRIPE) fail.push("mechanism stripe mismatch");
if (!/if-then|If the old sentence|If that sentence/i.test(fs.readFileSync("app/free/page.js", "utf8"))) fail.push("free page missing if-then");
if (!mech.if_then || !mech.evening || !Array.isArray(mech.post_lines) || mech.post_lines.length < 8) fail.push("mechanism incomplete");
if (new Set(mech.post_lines).size !== mech.post_lines.length) fail.push("repeated post lines");
if (!fs.readFileSync("scripts/repurpose-post.mjs", "utf8").includes("product-mechanism.json")) fail.push("repurpose not wired");
if (!fs.readFileSync("scripts/seo-publisher.mjs", "utf8").includes("product-mechanism.json")) fail.push("seo publisher not wired");
if (!fs.readFileSync("scripts/content-forge.mjs", "utf8").includes("social-link-in-bio-and-traffic")) fail.push("forge missing link skill");
if (!fs.readFileSync("public/llms.txt", "utf8").includes("if-then")) fail.push("llms.txt missing if-then");
if (fail.length) {
  console.log(fail.join("\n"));
  process.exit(1);
}
console.log("mechanism-check OK", mech.post_lines.length, "post lines");
