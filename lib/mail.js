// Transactional email via Mailjet (free plan: 6,000/month, 200/day; no card). Keys live in Vercel env (set by deploy.yml from GitHub secrets).
// Sender is the account email (auto-validated by Mailjet). Never log addresses or keys.
export function mailConfigured() { return !!(process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY); }
export async function sendMail({ to, subject, text, html }) {
  if (!mailConfigured()) return { ok: false, error: "not configured" };
  const auth = Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`).toString("base64");
  const from = process.env.MAIL_FROM || "tryuderzhi@gmail.com";
  const r = await fetch("https://api.mailjet.com/v3.1/send", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ Messages: [{ From: { Email: from, Name: "Dan at Receipts" }, To: [{ Email: to }], Subject: subject, TextPart: text, HTMLPart: html,
      CustomCampaign: "day1-reminder", DeduplicateCampaign: true }] }) });
  const j = await r.json().catch(() => ({}));
  const status = j?.Messages?.[0]?.Status;
  return { ok: r.ok && status === "success", status: r.status, detail: status || j?.ErrorMessage || "" };
}
// Postal footer (anti-spam law: every commercial email carries the sender's postal address). Public record: Companies House 15180506.
export const POSTAL = "Tealstone Consulting Ltd · 61 Bridge Street, Kington, Herefordshire, HR5 3DJ, United Kingdom";
