import "server-only";
// fulfillCheckout(sessionId): safe to call many times (landing page + webhook, possibly concurrently).
// 1) retrieve the Checkout Session with line_items expanded, 2) check payment_status, 3) fulfil = grant access
// (access is stateless: /pack and /pack/file verify against Stripe on every request, so there is nothing to double-provision),
// 4) record: an in-memory per-instance set + structured log line (Vercel logs). No database by design (free tier).
const KEY = process.env.STRIPE_API_KEY;
const done = globalThis.__receiptsFulfilled ??= new Set();
export async function fulfillCheckout(sessionId) {
  if (!KEY || !/^cs_[A-Za-z0-9_]+$/.test(String(sessionId || ""))) return { ok: false, reason: "bad id or no key" };
  if (done.has(sessionId)) return { ok: true, already: true, sessionId };
  const s = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=line_items`, { headers: { Authorization: `Bearer ${KEY}` }, cache: "no-store" }).then(r => r.json()).catch(e => ({ error: { message: String(e) } }));
  if (s.error) return { ok: false, reason: s.error.message, sessionId };
  if (s.payment_status === "unpaid") return { ok: false, reason: "unpaid", sessionId };
  done.add(sessionId);
  // Receipt email: Stripe emails a receipt when the PaymentIntent has receipt_email, even if the Dashboard
  // "Successful payments" toggle is off (https://docs.stripe.com/receipts). Payment Links don't set it, so set it here once.
  const email = s.customer_details?.email || null, pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
  let receipt = "skipped";
  if (email && pi) {
    const r = await fetch(`https://api.stripe.com/v1/payment_intents/${pi}`, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ receipt_email: email }) }).then(r => r.json()).catch(e => ({ error: { message: String(e) } }));
    receipt = r.error ? `error ${r.error.code || r.error.type}` : "sent";
  }
  return { receipt, ok: true, sessionId, email, amount: s.amount_total, currency: s.currency, src: s.client_reference_id || null, items: (s.line_items?.data || []).map(li => `${li.quantity}x ${li.description}`) };
}
