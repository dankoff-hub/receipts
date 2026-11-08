#!/usr/bin/env node
// Swarm survival scoreboard. Prints one verdict line for the daily brief.
// Revenue source: Stripe Checkout Sessions (payment link), via STRIPE_API_KEY
// (read-only restricted key, rk_live_..., checkout sessions read). Offline if unset.
const KEY = process.env.STRIPE_API_KEY;
const TARGET = Number(process.env.SWARM_TARGET_MONTHLY || 50000); // operating target, USD per 30-day cycle
const NORTH_STAR = 300000; // report-only; never the elimination line
const LAUNCH = Date.parse("2026-11-03T00:00:00Z");
const CYCLE_DAYS = 30;
const now = Date.now();
const cycle = Math.max(0, Math.floor((now - LAUNCH) / (CYCLE_DAYS * 86400000)));
const cycleStart = LAUNCH + cycle * CYCLE_DAYS * 86400000;
const daysElapsed = Math.max(1, Math.ceil((now - cycleStart) / 86400000));
const daysLeft = CYCLE_DAYS - daysElapsed;

const fmt = (n) => "$" + Math.round(n).toLocaleString("en-US");
let revenue = null, sales = 0, note = "";
if (KEY) {
  try {
    const auth = "Basic " + Buffer.from(KEY + ":").toString("base64");
    let url = `https://api.stripe.com/v1/checkout/sessions?status=complete&limit=100&created[gte]=${Math.floor(cycleStart / 1000)}`;
    revenue = 0;
    for (let page = 0; page < 5 && url; page++) {
      const r = await fetch(url, { headers: { Authorization: auth } });
      const j = await r.json();
      if (j.error) { note = "stripe: " + j.error.message; revenue = null; break; }
      for (const s of j.data || []) { revenue += (s.amount_total || 0) / 100; sales++; }
      url = j.has_more ? `https://api.stripe.com/v1/checkout/sessions?status=complete&limit=100&created[gte]=${Math.floor(cycleStart / 1000)}&starting_after=${j.data[j.data.length - 1].id}` : null;
    }
  } catch (e) { note = "stripe unreachable: " + e.message; revenue = null; }
}

if (revenue === null) {
  console.log(`REVENUE TRACKING OFFLINE (${note || "STRIPE_API_KEY not set"}) — survival cannot be verified. Cycle ${cycle + 1}, day ${daysElapsed}/${CYCLE_DAYS}, monthly target ${fmt(TARGET)}, north star ${fmt(NORTH_STAR)}/month.`);
  process.exit(0);
}
const projected = revenue / daysElapsed * CYCLE_DAYS;
const neededPerDay = Math.max(0, (TARGET - revenue) / Math.max(1, daysLeft));
const surviving = revenue >= TARGET || projected >= TARGET;
const verdict = revenue >= TARGET ? "TARGET ACHIEVED — SWARM PROMOTED" : surviving ? "SURVIVING" : `AT RISK — ELIMINATION IN ${daysLeft} DAYS`;
console.log(`SWARM STATUS: ${verdict} · cycle ${cycle + 1} day ${daysElapsed}/${CYCLE_DAYS} · revenue ${fmt(revenue)} (${sales} sales) · monthly target ${fmt(TARGET)} · need ${fmt(neededPerDay)}/day for remaining ${daysLeft} days · north star ${fmt(NORTH_STAR)}/month (not the verdict)`);
