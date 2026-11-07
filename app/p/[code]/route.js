import { NextResponse } from "next/server";
import { CODE_RE } from "../../../lib/attrib";
export const dynamic = "force-dynamic";
// Partner link: /p/<code>[?to=pricing] → cookie (60 days) → the free Step 1 page (the journey that converts) with the
// partner code as src, so the first screen still says where the visitor came from.
export function GET(req, { params }) {
  const code = String(params.code || "").toLowerCase();
  const url = new URL(req.url);
  const to = url.searchParams.get("to") === "pricing" ? "/pricing" : "/free";
  if (!CODE_RE.test(code)) return NextResponse.redirect(new URL("/free?src=p", url.origin));
  const res = NextResponse.redirect(new URL(`${to}?src=aff_${code}-p`, url.origin));
  res.cookies.set("rp_ref", code, { maxAge: 60 * 24 * 3600, path: "/", sameSite: "lax", secure: true });
  return res;
}
