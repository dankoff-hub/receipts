import "server-only";
import { cookies } from "next/headers";
// Partner attribution. /p/<code> sets rp_ref (60 days). Any page that builds a checkout link folds the code into
// client_reference_id as `aff_<code>-<src>` so the Stripe ledger (scripts/affiliate-ledger.mjs) can credit the sale.
// Rule: last partner link wins and beats an organic src (newsletter/creator traffic is the scarcer asset).
export const CODE_RE = /^[a-z0-9]{2,24}$/;
export function refCode() { try { const v = cookies().get("rp_ref")?.value || ""; return CODE_RE.test(v) ? v : ""; } catch { return ""; } }
export function withRef(src) { const c = refCode(); if (!c) return src; return src.startsWith("aff_") ? src : `aff_${c}-${src}`; }
