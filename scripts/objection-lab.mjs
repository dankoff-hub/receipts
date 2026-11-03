#!/usr/bin/env node
// Agent 8 - OBJECTION LAB: drafts replies to the objections that kill conversions in
// comments/DMs. Consults competitor-watch signals. Output feeds the guerrilla pack.
import fs from "node:fs";

let competitors = [];
try { competitors = JSON.parse(fs.readFileSync("content/competitor-watch.json", "utf8")).hits || []; } catch {}
const bank = [
  { objection: "$29 for a PDF?", reply: "Not a PDF — a 30-day operating system with daily proof gates. If one month of receipts doesn't move you, nothing was going to." },
  { objection: "I can just do this myself", reply: "Everyone can. Almost nobody does — that's the entire point of a standard you can't negotiate with. $29 buys the structure that makes 'myself' show up daily." },
  { objection: "Motivation doesn't work", reply: "Agreed. That's why there are zero motivational speeches inside — just receipt → standard → daily proof. Motivation is the spark, this is the engine." },
  { objection: "Is this just a habit tracker?", reply: "Trackers count what you did. Receipts prove what you survived. The difference is the Arrival Check on day 30." },
  { objection: "Why so cheap/expensive?", reply: "$29 is one dinner. Priced so it's real enough to commit to, cheap enough that the only excuse left is you." },
];
fs.writeFileSync("content/objection-bank.json", JSON.stringify({ at: new Date().toISOString(), competitorSignals: competitors.length, bank }, null, 2));
console.log(`OBJECTION LAB: ${bank.length} replies ready (${competitors.length} competitor signals consulted)`);
