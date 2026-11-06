// Email capture for /free. Provider: MailerLite (free tier) when MAILERLITE_API_KEY is set; otherwise reports not-configured (template stays free either way).
export const dynamic = "force-dynamic";
export async function POST(req) {
  let body = {}; try { body = await req.json(); } catch {}
  const email = String(body.email || "").trim().toLowerCase().slice(0, 120); const src = String(body.src || "free").replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ ok: false, error: "invalid email" }, { status: 400 });
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) return Response.json({ ok: false, error: "not configured" }, { status: 503 });
  const r = await fetch("https://connect.mailerlite.com/api/subscribers", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ email, fields: { source: src }, groups: process.env.MAILERLITE_GROUP_ID ? [process.env.MAILERLITE_GROUP_ID] : undefined }) });
  if (!r.ok) return Response.json({ ok: false, error: "provider " + r.status }, { status: 502 });
  return Response.json({ ok: true });
}
