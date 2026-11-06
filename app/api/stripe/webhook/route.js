// Stripe fulfillment webhook — per https://docs.stripe.com/checkout/fulfillment
// Listens for checkout.session.completed / checkout.session.async_payment_succeeded, verifies the signature,
// and runs fulfillCheckout(sessionId): idempotent, retrieves the session with line_items expanded, checks payment_status.
// Access to the pack is derived from Stripe's own payment state (see lib/pack.js), so fulfillment here = verify + record.
import crypto from "node:crypto";
import { fulfillCheckout } from "../../../../lib/fulfill";
export const dynamic = "force-dynamic";
function verify(payload, header, secret) {
  const parts = Object.fromEntries(String(header || "").split(",").map(kv => kv.split("=")));
  const t = parts.t, sigs = String(header || "").split(",").filter(p => p.startsWith("v1=")).map(p => p.slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // 5-minute tolerance (replay protection)
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return sigs.some(s => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
export async function POST(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("webhook not configured", { status: 503 });
  const payload = await req.text();
  if (!verify(payload, req.headers.get("stripe-signature"), secret)) return new Response("bad signature", { status: 400 });
  let event; try { event = JSON.parse(payload); } catch { return new Response("bad payload", { status: 400 }); }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const r = await fulfillCheckout(event.data.object.id);
    console.log("fulfill", event.type, JSON.stringify(r));
  } else if (event.type === "checkout.session.async_payment_failed") {
    console.log("async payment failed", event.data.object.id, event.data.object.customer_details?.email);
  }
  return Response.json({ received: true });
}
