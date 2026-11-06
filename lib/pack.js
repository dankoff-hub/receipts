// Server-only helpers for the paid pack: Stripe verification (restricted read-only key) + content bundle.
import "server-only";
const KEY = process.env.STRIPE_API_KEY;
const H = () => ({ Authorization: `Bearer ${KEY}` });
export const cleanEmail = e => String(e || "").trim().toLowerCase().slice(0, 120);
export async function isPaidSession(id) {
  if (!KEY || !/^cs_[A-Za-z0-9_]+$/.test(String(id || ""))) return false;
  const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, { headers: H(), cache: "no-store" }).then(r => r.json()).catch(() => null);
  return !!r && r.payment_status === "paid";
}
export async function hasPaidByEmail(email) {
  email = cleanEmail(email); if (!KEY || !email.includes("@")) return false;
  const q = new URLSearchParams({ "customer_details[email]": email, status: "complete", limit: "10" });
  const r = await fetch(`https://api.stripe.com/v1/checkout/sessions?${q}`, { headers: H(), cache: "no-store" }).then(r => r.json()).catch(() => null);
  return !!r?.data?.some(s => s.payment_status === "paid");
}
export async function verify(params) {
  if (params?.session_id && await isPaidSession(params.session_id)) return { ok: true, key: "session_id", val: params.session_id };
  if (params?.email && await hasPaidByEmail(params.email)) return { ok: true, key: "email", val: cleanEmail(params.email) };
  return { ok: false };
}
export function loadBundle() {
  const b = require("./pack-bundle.json"); return b?.sections?.length ? b : null; // placeholder in git; overwritten by scripts/bundle-pack.mjs at deploy time
}
