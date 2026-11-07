// Privacy notice — plain language, covers exactly what the site does: Stripe checkout, optional reminder email, basic analytics-free hosting.
import { C, eyebrow, link } from "../theme";
export const metadata = { title: "Privacy · Receipts" };
const H = ({ children }) => <h2 style={{ fontSize: 18, margin: "22px 0 6px" }}>{children}</h2>;
export default function Privacy() {
  return <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px", lineHeight: 1.55 }}>
    <p style={{ ...eyebrow, margin: 0 }}>Receipts Pack</p>
    <h1 style={{ fontSize: 28, margin: "6px 0 10px" }}>Privacy</h1>
    <p style={{ color: C.body }}>Last updated 7 November 2026. Short version: we collect the least we can, and we never sell or share your data for marketing.</p>
    <H>Who we are</H>
    <p>Receipts Pack is operated by Tealstone Consulting Ltd (Companies House 15180506), 61 Bridge Street, Kington, Herefordshire, HR5 3DJ, United Kingdom. Contact: tryuderzhi@gmail.com.</p>
    <H>What we collect and why</H>
    <ul>
      <li><b>Email address</b> — only if you type it into the “Remind me” box on the free page. Used for one day-1 reminder email, then nothing else. Stored in private storage on Vercel; sent through Mailjet.</li>
      <li><b>Purchase details</b> — handled entirely by Stripe when you buy the pack. We receive the payment status and the email you used at checkout so we can unlock the pack for you. We never see your card number.</li>
      <li><b>Progress</b> — the Step 1 progress bar is stored in your own browser (localStorage) and never sent to us.</li>
      <li><b>Server logs</b> — our host (Vercel) keeps standard request logs for a short period to run the site. We do not run advertising trackers or third-party analytics on this site.</li>
    </ul>
    <H>Emails</H>
    <p>If you ask for the reminder you get one email. Every email carries our postal address and a way to opt out: reply with “stop” and we delete your address. We do not send newsletters or promotions to this list.</p>
    <H>Legal basis and retention</H>
    <p>Reminder emails: your consent (you asked for it). Purchases: performance of a contract. Reminder addresses are deleted on request and otherwise within 12 months; purchase records are kept as long as the law requires for accounting.</p>
    <H>Your rights</H>
    <p>You can ask what we hold about you, ask us to correct or delete it, or object to processing. Email tryuderzhi@gmail.com. If you are in the UK or EU you can also complain to your data protection authority (UK: the ICO).</p>
    <H>Third parties we rely on</H>
    <p>Stripe (payments), Vercel (hosting and storage), Mailjet (email delivery). Each processes data under its own terms; we only pass them what is needed for the step above.</p>
    <p style={{ marginTop: 28 }}><a href="/" style={{ ...link, display: "inline-block", padding: "10px 0" }}>← Home</a> &nbsp;·&nbsp; <a href="/free" style={{ ...link, display: "inline-block", padding: "10px 0" }}>Free Step 1 template</a></p>
  </main>;
}
