// Partner applications → private Vercel Blob (never the public repo). Payout details are collected later, by the founder.
import { put } from "@vercel/blob";
import crypto from "node:crypto";
export const dynamic = "force-dynamic";
const clean = (s, n) => String(s || "").trim().slice(0, n);
export async function POST(req) {
  let b = {}; try { b = await req.json(); } catch {}
  const email = clean(b.email, 120).toLowerCase(), name = clean(b.name, 80), platform = clean(b.platform, 40), handle = clean(b.handle, 120), audience = clean(b.audience, 40), note = clean(b.note, 600);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !handle) return Response.json({ ok: false, error: "email and handle required" }, { status: 400 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ ok: false, error: "not configured" }, { status: 503 });
  const id = crypto.createHash("sha256").update(email).digest("hex").slice(0, 24);
  await put(`partners/applications/${id}.json`, JSON.stringify({ email, name, platform, handle, audience, note, at: new Date().toISOString() }), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
  return Response.json({ ok: true });
}
