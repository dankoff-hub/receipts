// Day-1 reminder runner. Called hourly by .github/workflows/day1-reminder.yml with header x-cron-key = CRON_SECRET.
// Reads subscribers/*.json from private Vercel Blob, emails anyone who signed up 20h+ ago and has not been reminded, marks them.
// One email per subscriber, ever. No guarantee/refund language. Postal footer required by anti-spam law.
import { list, get, put } from "@vercel/blob";
import { sendMail, mailConfigured, POSTAL } from "../../../../lib/mail";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const SITE = "https://receiptspack.vercel.app";
function body(src) {
  const free = `${SITE}/free?src=email`, sheet = `${SITE}/free/sheet?src=email`, pricing = `${SITE}/pricing?src=email`;
  const text = `Day 1.

Yesterday you grabbed the Step 1 template. Today is the only day it matters: write the receipt once, exactly as it happened, then close the page.

Printable sheet: ${sheet}
Your progress bar (Step 1 → Step 2): ${free}

Step 2 turns the receipt into a standard you can check every morning. It is $29, one-time, inside the Receipts Pack: ${pricing}

That is the only email you will get from me.
— Dan

${POSTAL}
You received this because you asked for a reminder at ${SITE}/free (source: ${src}). Reply "stop" and you will never hear from me again.`;
  const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">
<p style="font-size:22px;font-weight:700;margin:0 0 12px">Day 1.</p>
<p>Yesterday you grabbed the Step 1 template. Today is the only day it matters: write the receipt once, exactly as it happened, then close the page.</p>
<p><a href="${sheet}" style="display:inline-block;background:#0F4C3A;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Open the printable sheet</a></p>
<p>Your progress bar (Step 1 → Step 2): <a href="${free}">${free.replace("https://", "")}</a></p>
<p>Step 2 turns the receipt into a standard you can check every morning. It is $29, one-time, inside the <a href="${pricing}">Receipts Pack</a>.</p>
<p>That is the only email you will get from me.<br>— Dan</p>
<hr style="border:0;border-top:1px solid #ddd;margin:20px 0">
<p style="font-size:12px;color:#666">${POSTAL}<br>You received this because you asked for a reminder at <a href="${SITE}/free" style="color:#666">${SITE.replace("https://", "")}/free</a> (source: ${src}). Reply "stop" and you will never hear from me again.</p></div>`;
  return { text, html };
}
export async function POST(req) {
  const key = process.env.CRON_SECRET;
  if (!key || req.headers.get("x-cron-key") !== key) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!mailConfigured()) return Response.json({ ok: false, error: "mail not configured" }, { status: 503 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ ok: false, error: "blob not configured" }, { status: 503 });
  const cutoff = Date.now() - 20 * 3600e3, cap = Number(process.env.REMINDER_HOURLY_CAP || 25);
  let sent = 0, skipped = 0, failed = 0, pending = 0, cursor;
  do {
    const page = await list({ prefix: "subscribers/", cursor, limit: 200 });
    cursor = page.hasMore ? page.cursor : undefined;
    for (const b of page.blobs) {
      if (sent >= cap) { pending++; continue; }
      const res = await get(b.pathname, { access: "private" }).catch(() => null);
      if (!res?.body) { failed++; continue; }
      let rec; try { rec = await new Response(res.body).json(); } catch { failed++; continue; }
      if (rec.remindedAt || rec.unsub) { skipped++; continue; }
      if (!rec.at || Date.parse(rec.at) > cutoff) { pending++; continue; }
      const { text, html } = body(rec.src || "free");
      const r = await sendMail({ to: rec.email, subject: "Day 1 — write it once, then close it", text, html });
      if (!r.ok) { failed++; console.error("reminder send failed", r.status, r.detail); continue; }
      rec.remindedAt = new Date().toISOString();
      await put(b.pathname, JSON.stringify(rec), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
      sent++;
    }
  } while (cursor);
  return Response.json({ ok: true, sent, skipped, pending, failed });
}
