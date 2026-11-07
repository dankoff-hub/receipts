#!/usr/bin/env node
// Read-only customer-journey audit: page reachability + CTA links + Stripe checkout-session config (success_url, status). Prints no secrets.
const SITE = process.env.APP_URL || "https://receipts-blond.vercel.app";
const PAY = "https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
const pages = ["/", "/bio?src=ig", "/free?src=ig", "/free/sheet?src=ig", "/pricing", "/pack"];
for (const p of pages) {
  const r = await fetch(SITE + p); const html = await r.text();
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]).filter(h => /stripe|\/free|\/bio|\/pack|\/pricing/.test(h));
  console.log(`${p} -> ${r.status} | ${Math.round(html.length/1024)}KB | CTAs: ${[...new Set(links)].join(" , ")}`);
}
const s = await fetch(PAY, { redirect: "manual" }); console.log(`payment link -> ${s.status}`);
const KEY = process.env.STRIPE_API_KEY; if (!KEY) { console.log("no STRIPE_API_KEY"); process.exit(0); }
const H = { Authorization: `Bearer ${KEY}` };
const j = await (await fetch("https://api.stripe.com/v1/checkout/sessions?limit=20", { headers: H })).json();
if (j.error) { console.log("stripe sessions error:", j.error.type, j.error.code, j.error.message?.slice(0, 160)); process.exit(0); }
console.log(`checkout sessions (last ${j.data.length}):`);
for (const c of j.data) console.log(` ${new Date(c.created*1000).toISOString()} status=${c.status} payment=${c.payment_status} amount=${c.amount_total} ${c.currency} src=${c.client_reference_id} success_url=${c.success_url} email_collected=${!!c.customer_details?.email} payment_link=${c.payment_link ? "yes" : "no"} after_expiration_recovery=${c.after_expiration ? "yes" : "no"}`);
const paid = j.data.filter(c => c.payment_status === "paid"); console.log(`paid sessions in this page: ${paid.length}`);
for (const id of ["payment_links/" + "", "products?limit=3", "prices?limit=3"]) { if (!id.endsWith("/")) { const r = await (await fetch("https://api.stripe.com/v1/" + id, { headers: H })).json(); console.log(id, "->", r.error ? `${r.error.code || r.error.type}` : `${r.data.length} readable`); } }
