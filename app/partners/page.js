import Apply from "./Apply";
import prog from "../../content/partner-program.json";
import { C, card, eyebrow, h1, h2, sub, small, link } from "../theme";
export const metadata = { title: "Partner programme · Receipts", description: "Earn 50% ($14.50) on every Receipts Pack your audience buys. Free pack, tracked link, monthly PayPal payout." };
const Row = ({ k, v }) => <div style={{ display: "flex", gap: 12, justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}><span style={{ color: C.muted }}>{k}</span><span style={{ color: C.ink, fontWeight: 600, textAlign: "right" }}>{v}</span></div>;
export default function Partners() {
  return <main style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
    <p style={eyebrow}>Receipts · Partner programme</p>
    <h1 style={{ ...h1, fontSize: 34, margin: "6px 0 10px" }}>Your audience keeps receipts. You keep half of every sale.</h1>
    <p style={sub}>Receipts is a $29, 30-day proof system for people who were told they were not ready. Step 1 is free, so your followers can try it before they pay anything. You get a tracked link, the full pack for free, and 50% of every sale it produces ($14.50 of $29).</p>
    <div style={{ ...card, padding: 22, borderColor: C.primary }}>
      <Row k="Commission" v={`${prog.commission_pct}% — $${prog.commission_usd_per_sale.toFixed(2)} per $29 sale`} />
      <Row k="Founding rate" v="locked 12 months for partners joining before 31 Jan 2027" />
      <Row k="Attribution" v={`${prog.attribution_window_days} days, last partner link wins`} />
      <Row k="Payout" v="monthly by the 5th · PayPal or Wise" />
      <Row k="Minimum" v={`$${prog.payout.minimum_usd} (smaller balances roll over)`} />
      <Row k="Your cost" v="none. No fee, no quota, no exclusivity" />
    </div>
    <h2 style={h2}>How it works</h2>
    <ol style={{ color: C.body, lineHeight: 1.7, margin: "0 0 0 20px", padding: 0 }}>
      <li>Apply below. We reply within 3 days with your link <code style={{ background: C.accentSoft, padding: "1px 6px", borderRadius: 6 }}>receiptspack.vercel.app/p/yourname</code> and the free pack.</li>
      <li>Try the system yourself. Recommend it only if you would anyway; say so in your own words.</li>
      <li>Put the link where people can tap it: bio, description, pinned comment, newsletter P.S. Label it #ad or “affiliate link”.</li>
      <li>Every month you get a one-line statement (sales, amount) and the payout.</li>
    </ol>
    <h2 style={h2}>Who it suits</h2>
    <p style={{ color: C.body, lineHeight: 1.6 }}>Creators and writers in discipline, self-improvement, journaling, comeback stories, career setbacks and “prove them wrong” motivation, with an audience of 1k to 200k that trusts you. Fit beats size: a 2,000-reader newsletter in this niche typically outsells a general 200k account.</p>
    <h2 style={h2}>What we ask</h2>
    <ul style={{ color: C.body, lineHeight: 1.7, margin: "0 0 0 20px", padding: 0 }}>
      <li>Disclose the relationship (FTC Endorsement Guides / UK CAP Code).</li>
      <li>No earnings, therapy or medical claims. Receipts is a self-reflection tool.</li>
      <li>No paid ads on our brand name, no coupon or cashback sites, no bought traffic.</li>
    </ul>
    <h2 style={h2}>Apply</h2>
    <div style={card}><Apply /></div>
    <p style={{ ...small, lineHeight: 2.2 }}>Full terms: <a href="/partners/terms" style={{ ...link, display: "inline-block", padding: "10px 0" }}>one page, plain English</a>. Programme run by Tealstone Consulting Ltd (Companies House 15180506). <a href="/privacy" style={{ color: C.muted, display: "inline-block", padding: "10px 0" }}>Privacy</a></p>
  </main>;
}
