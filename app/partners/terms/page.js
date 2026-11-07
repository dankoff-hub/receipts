import prog from "../../../content/partner-program.json";
import { C, eyebrow, h1, h2, small, link } from "../../theme";
export const metadata = { title: "Partner terms · Receipts" };
const P = ({ children }) => <p style={{ color: C.body, lineHeight: 1.65 }}>{children}</p>;
export default function Terms() {
  return <main style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
    <p style={eyebrow}>Receipts · Partner terms</p>
    <h1 style={{ ...h1, fontSize: 30, margin: "6px 0 14px" }}>Partner terms (one page)</h1>
    <P>These terms apply between Tealstone Consulting Ltd (“we”, Companies House 15180506, 61 Bridge Street, Kington, Herefordshire, HR5 3DJ) and you, the partner, once we have sent you a partner link. Version 2026-11-07.</P>
    <h2 style={h2}>1. Commission</h2>
    <P>We pay {prog.commission_pct}% of the price paid (USD {prog.commission_usd_per_sale.toFixed(2)} at the current price of USD {prog.product_price_usd}) for each completed, non-disputed purchase of the Receipts Pack (USD {prog.product_price_usd}) made within {prog.attribution_window_days} days of a click on your partner link. If a buyer clicks several partners’ links, the last click wins. Self-purchases and purchases by your household do not count. Partners who join before 31 January 2027 keep this rate for 12 months from joining; afterwards we may change the rate with 30 days’ notice, never retroactively.</P>
    <h2 style={h2}>2. Payout</h2>
    <P>We pay monthly by the 5th for the previous calendar month, by PayPal or Wise to the account you give us, once your balance reaches USD {prog.payout.minimum_usd}. Smaller balances roll over. A sale becomes payable {prog.payout.hold_days} days after payment; a sale that is charged back or disputed is removed from the balance. You are responsible for any tax on your earnings. We send a one-line statement with each payout.</P>
    <h2 style={h2}>3. How you may promote</h2>
    <P>Honest, in your own words, with the relationship disclosed as advertising wherever the link appears (FTC Endorsement Guides; UK CAP Code: “#ad” or “affiliate link” up front). Not allowed: earnings, therapy or medical claims; refund or guarantee language; search or social ads on the words “Receipts Pack”; coupon, cashback or deal sites; bought traffic, bots or spam; anything that misrepresents what Receipts is (a self-reflection and goal tool).</P>
    <h2 style={h2}>4. Links, cookies and data</h2>
    <P>Your link sets a first-party cookie for {prog.attribution_window_days} days. We keep per-partner sales counts and the contact and payout details you give us; we never share your buyers’ details with you or yours with anyone else. See our <a href="/privacy" style={{ ...link, display: "inline-block", padding: "10px 0" }}>privacy page</a>.</P>
    <h2 style={h2}>5. Ending</h2>
    <P>Either side may end the partnership at any time by email. Earned, undisputed commission is still paid at the next monthly payout. We may withhold payment for traffic that breaks section 3, and will tell you why.</P>
    <h2 style={h2}>6. Independence</h2>
    <P>You are an independent partner, not an employee or agent; you may not make promises on our behalf. English law applies.</P>
    <p style={small}><a href="/partners" style={{ ...link, display: "inline-block", padding: "12px 0" }}>← Partner programme</a></p>
  </main>;
}
