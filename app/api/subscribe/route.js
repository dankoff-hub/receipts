// Email capture for /free. Storage: Vercel Blob (free Hobby tier) when BLOB_READ_WRITE_TOKEN is set — one private JSON per
// subscriber, de-duplicated by email hash. Optional: also pushes to MailerLite when MAILERLITE_API_KEY is set.
import { put } from "@vercel/blob";
import crypto from "node:crypto";
export const dynamic = "force-dynamic";
export async function POST(req) {
  let body = {}; try { body = await req.json(); } catch {}
  const email = String(body.email || "").trim().toLowerCase().slice(0, 120); const src = String(body.src || "free").replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ ok: false, error: "invalid email" }, { status: 400 });
  const key = process.env.MAILERLITE_API_KEY, blob = process.env.BLOB_READ_WRITE_TOKEN;
  if (!key && !blob) return Response.json({ ok: false, error: "not configured" }, { status: 503 });
  if (blob) {
    const id = crypto.createHash("sha256").update(email).digest("hex").slice(0, 24);
    await put(`subscribers/${id}.json`, JSON.stringify({ email, src, at: new Date().toISOString() }), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" }).catch(e => console.error("blob put failed", e?.message));
  }
  if (!key) return Response.json({ ok: true, sends: false }); // stored only — no provider yet, the page must not promise an email
  const r = await fetch("https://connect.mailerlite.com/api/subscribers", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ email, fields: { source: src }, groups: process.env.MAILERLITE_GROUP_ID ? [process.env.MAILERLITE_GROUP_ID] : undefined }) });
  if (!r.ok) return Response.json({ ok: false, error: "provider " + r.status }, { status: 502 });
  return Response.json({ ok: true, sends: true });
}
