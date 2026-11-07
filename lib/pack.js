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
// Partner access: /pack?partner=<code>&k=<first 16 hex of HMAC-SHA256(PARTNER_PACK_SECRET, "partner:"+code)>. Issued by the
// founder/sender with scripts/partner-grant.mjs (needs the same secret). Lets a partner read the pack before recommending it.
export function partnerKey(code) { const s = process.env.PARTNER_PACK_SECRET; if (!s || !/^[a-z0-9]{2,24}$/.test(code || "")) return null;
  return require("node:crypto").createHmac("sha256", s).update("partner:" + code).digest("hex").slice(0, 16); }
export async function verify(params) {
  if (params?.partner && params?.k && partnerKey(String(params.partner).toLowerCase()) === String(params.k)) return { ok: true, key: "partner", val: String(params.partner).toLowerCase(), extra: "&k=" + String(params.k).replace(/[^a-f0-9]/g, "") };
  if (params?.session_id && await isPaidSession(params.session_id)) return { ok: true, key: "session_id", val: params.session_id };
  if (params?.email && await hasPaidByEmail(params.email)) return { ok: true, key: "email", val: cleanEmail(params.email) };
  return { ok: false };
}
export function loadBundle() {
  const b = require("./pack-bundle.json"); return b?.sections?.length ? b : null; // placeholder in git; overwritten by scripts/bundle-pack.mjs at deploy time
}
