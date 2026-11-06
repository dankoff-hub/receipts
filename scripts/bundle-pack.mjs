#!/usr/bin/env node
// Deploy-time only: turn ./pack-content (private repo checkout) into pack-bundle.json (gitignored) for the gated /pack route.
import fs from "node:fs";
const dir = process.argv[2] || "pack-content/content";
if (!fs.existsSync(dir)) { console.log("no pack content at", dir, "— /pack will show the missing-bundle notice"); process.exit(0); }
const sections = JSON.parse(fs.readFileSync(`${dir}/pack.json`, "utf8"));
const files = { log: { filename: "receipts-30-day-log.pdf" }, worksheets: { filename: "receipts-worksheets.pdf" } };
for (const k of Object.keys(files)) files[k].b64 = fs.readFileSync(`${dir}/${files[k].filename}`).toString("base64");
fs.writeFileSync("lib/pack-bundle.json", JSON.stringify({ sections, files }));
console.log("lib/pack-bundle.json:", sections.length, "sections,", Object.keys(files).length, "files");
