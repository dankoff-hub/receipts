// Read-only QA probe: what does Stripe Checkout present to a visitor located where THIS function runs?
// Verified 2026-11-07: Stripe picks the presentment currency from browser_locale / browser_timezone (en-GB or Europe/London → GBP, de-DE → EUR),
// not only IP, so this probe works from any region. Use ?locale=&tz= to emulate a visitor. (Hobby deploy ignored preferredRegion=lhr1; ran in iad1.)
// Gated by PARTNER_PACK_SECRET (?k=) so it is not a public session-spawner. Creates one open (unpaid) checkout page per call, like any visitor.
import crypto from "node:crypto";
export const dynamic = "force-dynamic";
const PLINK = "dRm7sEfUs0CQbscfSx3840a";
export async function GET(req) {
  const u = new URL(req.url); const k = u.searchParams.get("k") || "", s = process.env.PARTNER_PACK_SECRET || "";
  if (!s || k.length !== s.length || !crypto.timingSafeEqual(Buffer.from(k), Buffer.from(s))) return Response.json({ ok: false }, { status: 401 });
  const locale = u.searchParams.get("locale") || "en-GB", tz = u.searchParams.get("tz") || "Europe/London";
  const r = await fetch(`https://merchant-ui-api.stripe.com/payment-links/${PLINK}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", Origin: "https://buy.stripe.com", Referer: `https://buy.stripe.com/${PLINK}`, "Accept-Language": locale, "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" }, body: new URLSearchParams({ eid: "NA", browser_locale: locale, browser_timezone: tz, client_reference_id: "qa_geo_" + (process.env.VERCEL_REGION || "local") }) });
  const j = await r.json().catch(() => ({}));
  const li = j.line_item_group?.line_items?.[0] || {};
  return Response.json({
    ok: r.ok, region: process.env.VERCEL_REGION || null, geocoding: j.geocoding || null,
    presented: { currency: j.currency, total: j.line_item_group?.total, subtotal: j.line_item_group?.subtotal, unit_amount: li.price?.unit_amount, price_currency: li.price?.currency, unit_amount_override: li.unit_amount_override ?? null },
    adaptive: Object.fromEntries(Object.entries(j).filter(([k]) => /adaptive|currency_conversion|presentment/i.test(k))),
    total_summary: j.total_summary || null,
    consent: { terms_of_service: j.consent_collection?.terms_of_service, custom_fields: (j.custom_fields || []).length, tos_text: j.custom_text?.terms_of_service_acceptance?.message || null, submit_text: j.custom_text?.submit?.message || null },
    payment_method_types: j.ordered_payment_method_types || j.payment_method_types || null, locale: j.locale,
  });
}
