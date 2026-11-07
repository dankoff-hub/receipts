#!/usr/bin/env node
// One-shot fulfillment setup per https://docs.stripe.com/checkout/fulfillment. Idempotent. Prints no secrets.
// 1) payment link after_completion -> redirect to /pack?session_id={CHECKOUT_SESSION_ID}
// 2) webhook endpoint for checkout.session.completed + async_payment_succeeded/failed -> prints NEW_WEBHOOK_SECRET=1 and writes the secret to a file for the workflow to push into Vercel env
import fs from "node:fs";
const KEY = process.env.STRIPE_API_KEY, SITE = process.env.APP_URL || "https://receiptspack.vercel.app";
const PLINK_URL = "https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
// Currency-neutral on purpose: Adaptive Pricing shows UK/EU buyers a local price (e.g. £22.59), so "$29" here would contradict the total.
const SUBMIT_NOTE = "Instant access: your pack opens right after payment. One-time payment, no subscription.";
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
    // 1b) simplify checkout (founder-approved 2026-11-07): drop the required custom dropdown; keep the legal consent checkbox; no phone/billing-address friction.
    console.log("checkout friction now:", JSON.stringify({ custom_fields: (pl.custom_fields || []).map(f => `${f.type}:${f.label?.custom || f.key}${f.optional ? "" : "*"}`), consent: pl.consent_collection, phone: pl.phone_number_collection?.enabled, billing: pl.billing_address_collection, promo: pl.allow_promotion_codes, submit_type: pl.submit_type, custom_text: pl.custom_text }));
    const upd = {};
    if ((pl.custom_fields || []).length) upd["custom_fields"] = "";            // empty string clears the array
    if (pl.phone_number_collection?.enabled) upd["phone_number_collection[enabled]"] = "false";
    if (pl.billing_address_collection !== "auto") upd["billing_address_collection"] = "auto";
    if (pl.submit_type !== "pay") upd["submit_type"] = "pay";
    if (pl.custom_text?.submit?.message !== SUBMIT_NOTE) upd["custom_text[submit][message]"] = SUBMIT_NOTE;
    if (Object.keys(upd).length) { const r = await api(`payment_links/${pl.id}`, upd); show("simplify checkout " + Object.keys(upd).join(","), r); if (!r.error) console.log("checkout friction after:", JSON.stringify({ custom_fields: (r.custom_fields || []).length, phone: r.phone_number_collection?.enabled, billing: r.billing_address_collection, submit_type: r.submit_type, submit_text: !!r.custom_text?.submit?.message })); }
    else console.log("checkout already simplified");
    // 1c) express consent for the digital-content withdrawal waiver (UK CCR 2013 reg 37 / EU CRD art 16(m)) must exist. Prefer Stripe's single checkbox with our wording; fall back to a one-option dropdown.
    const fresh = await api(`payment_links/${pl.id}`);
    const WAIVER = "I ask for immediate access to this digital content and acknowledge that I lose my 14-day right to cancel once access begins.";
    const hasCheckbox = fresh.consent_collection?.terms_of_service === "required", hasDropdown = (fresh.custom_fields || []).length > 0;
    if (!hasCheckbox && !hasDropdown) {
      const r1 = await api(`payment_links/${pl.id}`, { "consent_collection[terms_of_service]": "required", "custom_text[terms_of_service_acceptance][message]": WAIVER, "custom_text[submit][message]": SUBMIT_NOTE });
      show("consent checkbox (terms_of_service required + waiver text)", r1);
      if (r1.error) {
        const r2 = await api(`payment_links/${pl.id}`, { "custom_fields[0][key]": "immediate_access", "custom_fields[0][type]": "dropdown", "custom_fields[0][label][type]": "custom", "custom_fields[0][label][custom]": "Immediate access (required)", "custom_fields[0][dropdown][options][0][label]": "I agree: immediate access, I waive my 14-day right to cancel", "custom_fields[0][dropdown][options][0][value]": "agree", "custom_text[submit][message]": "Your pack opens immediately after payment. By choosing 'I agree' above, you expressly ask for immediate access to this digital content and acknowledge that you lose your 14-day right to cancel once access begins." });
        show("fallback: restore one-option consent dropdown", r2);
      }
    } else console.log("consent control present:", hasCheckbox ? "terms checkbox" : "dropdown");
    console.log("NOTE: Adaptive Pricing (currency picker + fee line) has no Payment Link API field — Dashboard only: Settings → Payments → Adaptive Pricing, or the link's Edit → Advanced options.");
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
