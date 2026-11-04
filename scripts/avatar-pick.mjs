#!/usr/bin/env node
// Avatar rotation picker: prints the avatar script slug to render next.
// - arg "rotate" (or empty): first slug in assets/avatar-scripts not yet used (content/avatar-ledger.json)
// - arg "<slug>": explicit render of that slug (manual dispatch; must exist)
// Prints empty when the rotation pool is exhausted — caller should skip the run.
import fs from "node:fs";
const arg = (process.argv[2] || "rotate").trim();
const dir = "assets/avatar-scripts";
const slugs = fs.readdirSync(dir).filter(f => f.endsWith(".wav")).map(f => f.replace(/\.wav$/, "")).sort();
let ledger = { used: [] };
try { ledger = JSON.parse(fs.readFileSync("content/avatar-ledger.json", "utf8")); } catch {}
if (arg !== "rotate") {
  if (!slugs.includes(arg)) { console.error(`unknown avatar script: ${arg} (have: ${slugs.join(", ")})`); process.exit(1); }
  console.log(arg); process.exit(0);
}
const next = slugs.find(s => !ledger.used.includes(s));
if (next) console.log(next);
