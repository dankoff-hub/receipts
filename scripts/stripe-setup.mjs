#!/usr/bin/env node
// One-shot fulfillment setup per https://docs.stripe.com/checkout/fulfillment. Idempotent. Prints no secrets.
// 1) payment link after_completion -> redirect to /pack?session_id={CHECKOUT_SESSION_ID}
// 2) webhook endpoint for checkout.session.completed + async_payment_succeeded/failed -> prints NEW_WEBHOOK_SECRET=1 and writes the secret to a file for the workflow to push into Vercel env
import fs from "node:fs";
const KEY = process.env.STRIPE_API_KEY, SITE = process.env.APP_URL || "https://receipts-blond.vercel.app";
const PLINK_URL = "https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/x-www-form-urlencoded" };
const api = async (path, body) => { const r = await fetch("https://api.stripe.com/v1/" + path, { method: body ? "POST" : "GET", headers: H, body: body ? new URLSearchParams(body) : undefined }); const j = await r.json(); return j; };
const show = (label, j) => console.log(label, j.error ? `ERROR ${j.error.type}/${j.error.code || ""}: ${j.error.message?.slice(0, 200)}` : "ok");
// --- 1) payment link
const links = await api("payment_links?limit=100&active=true");
if (links.error) show("list payment links", links);
else {
  const pl = links.data.find(l => l.url === PLINK_URL);
  if (!pl) console.log("payment link not found among", links.data.length, "active links");
  else {
    const want = `${SITE}/pack?session_id={CHECKOUT_SESSION_ID}`;
    const cur = pl.after_completion?.redirect?.url;
    console.log("payment link", pl.id, "current after_completion:", pl.after_completion?.type, cur || "");
    if (cur === want) console.log("redirect already correct");
    else show("update redirect", await api(`payment_links/${pl.id}`, { "after_completion[type]": "redirect", "after_completion[redirect][url]": want }));
  }
}
// --- 2) webhook endpoint
const url = `${SITE}/api/stripe/webhook`;
const eps = await api("webhook_endpoints?limit=100");
if (eps.error) show("list webhook endpoints", eps);
else {
  const existing = eps.data.find(e => e.url === url);
  if (existing) console.log("webhook endpoint exists", existing.id, existing.status, existing.enabled_events.join(","));
  else {
    const created = await api("webhook_endpoints", { url, "enabled_events[0]": "checkout.session.completed", "enabled_events[1]": "checkout.session.async_payment_succeeded", "enabled_events[2]": "checkout.session.async_payment_failed", description: "Receipts Pack fulfillment (docs.stripe.com/checkout/fulfillment)" });
    show("create webhook endpoint", created);
    if (!created.error && created.secret) { fs.writeFileSync(process.env.SECRET_OUT || "/tmp/whsec", created.secret, { mode: 0o600 }); console.log("NEW_WEBHOOK_SECRET=1"); }
  }
}
