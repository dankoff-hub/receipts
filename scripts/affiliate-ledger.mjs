// Partner (affiliate) ledger — read-only against Stripe, writes counts only (no buyer data) to content/affiliate-ledger.json.
// Credits a sale to partner <code> when the Checkout Session's client_reference_id contains `aff_<code>` (set by /p/<code>).
// On the 1st–5th of each month it opens/updates a "Partner payouts <YYYY-MM>" issue = the founder's payout statement.
// Paying is Critical tier: a human sends the PayPal/Wise transfers and ticks the boxes. This script never moves money.
import fs from "node:fs"; import { execSync } from "node:child_process";
const K = process.env.STRIPE_API_KEY; if (!K) { console.log("no STRIPE_API_KEY; skip"); process.exit(0); }
const prog = JSON.parse(fs.readFileSync("content/partner-program.json", "utf8"));
const H = { Authorization: `Bearer ${K}` }, since = Math.floor(Date.parse("2026-11-01T00:00:00Z") / 1000);
async function page(path) { const out = []; let url = `https://api.stripe.com/v1/${path}&limit=100&created[gte]=${since}`;
  while (url) { const j = await (await fetch(url, { headers: H })).json(); if (j.error) throw new Error(j.error.message); out.push(...(j.data || [])); url = j.has_more ? `${url.split("&starting_after=")[0]}&starting_after=${j.data.at(-1).id}` : null; } return out; }
const sessions = (await page("checkout/sessions?status=complete")).filter(s => s.payment_status === "paid");
// Refund/dispute reversal needs "Charges and Refunds: read" on the restricted key. Until the founder grants it, the
// ledger still runs and flags the gap (reversals then get applied at payout time by the human reading the Stripe dashboard).
let reversalsKnown = true; const safe = async p => { try { return await page(p); } catch (e) { reversalsKnown = false; console.log(`note: ${p.split("?")[0]} not readable with this key (${e.message.slice(0, 60)}…) — reversals must be checked by hand before payout`); return []; } };
const refunded = new Set((await safe("refunds?")).map(r => r.payment_intent).filter(Boolean));
const disputed = new Set((await safe("disputes?")).map(d => d.payment_intent).filter(Boolean));
const now = Date.now(), hold = prog.payout.hold_days * 86400e3;
const by = {}, months = {};
for (const s of sessions) {
  const m = /aff_([a-z0-9]{2,24})/.exec(s.client_reference_id || ""); if (!m) continue;
  const code = m[1], bad = refunded.has(s.payment_intent) || disputed.has(s.payment_intent);
  const when = new Date(s.created * 1000), month = when.toISOString().slice(0, 7);
  const r = (by[code] ||= { sales: 0, reversed: 0, gross_usd: 0, commission_usd: 0, payable_usd: 0, pending_usd: 0, first_sale: null, last_sale: null });
  if (bad) { r.reversed++; continue; }
  r.sales++; r.gross_usd += (s.amount_total || 0) / 100; r.commission_usd += prog.commission_usd_per_sale;
  (now - when.getTime() > hold ? (r.payable_usd += prog.commission_usd_per_sale) : (r.pending_usd += prog.commission_usd_per_sale));
  r.first_sale ||= when.toISOString().slice(0, 10); r.last_sale = when.toISOString().slice(0, 10);
  const mm = (months[month] ||= {}); const mc = (mm[code] ||= { sales: 0, commission_usd: 0 }); mc.sales++; mc.commission_usd += prog.commission_usd_per_sale;
}
const ledger = { updated: new Date().toISOString(), reversals_checked: reversalsKnown, commission_usd_per_sale: prog.commission_usd_per_sale, partners: by, months, total_partner_sales: Object.values(by).reduce((a, b) => a + b.sales, 0) };
fs.writeFileSync("content/affiliate-ledger.json", JSON.stringify(ledger, null, 1));
console.log(`partner sales: ${ledger.total_partner_sales} across ${Object.keys(by).length} partners`);
// Monthly statement issue (1st–5th), for the previous month.
const d = new Date(); if (d.getUTCDate() <= 5 && process.env.GITHUB_TOKEN) {
  const prev = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 7), title = `Partner payouts ${prev}`;
  const rows = Object.entries(months[prev] || {}).map(([c, v]) => ({ c, ...v })).filter(x => x.commission_usd >= prog.payout.minimum_usd || true);
  const body = rows.length ? `Payout statement for ${prev} (commission $${prog.commission_usd_per_sale}/sale; minimum $${prog.payout.minimum_usd}, smaller balances roll over).\n\n| Partner | Sales | Owed (USD) | Pay? |\n|---|---|---|---|\n` + rows.map(x => `| ${x.c} | ${x.sales} | ${x.commission_usd.toFixed(2)} | ${x.commission_usd >= prog.payout.minimum_usd ? "[ ] paid via PayPal/Wise" : "roll over"} |`).join("\n") + `\n\nFounder-only: send transfers, tick, close. Statement lines to partners go out with the payment.` : `No partner-attributed sales in ${prev}. Nothing to pay.`;
  try { const exists = execSync(`gh issue list --search "${title}" --state all --json title -q '.[].title'`, { encoding: "utf8" }).includes(title);
    if (!exists) { execSync(`gh issue create --title "${title}" --body-file -`, { input: body, stdio: ["pipe", "inherit", "inherit"] }); console.log("statement issue created"); } } catch (e) { console.log("issue step skipped:", e.message); }
}
