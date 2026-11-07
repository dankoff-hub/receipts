import { verify, loadBundle } from "../../lib/pack";
import { fulfillCheckout } from "../../lib/fulfill";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your Receipts Pack", robots: { index: false, follow: false } };
const box = { background: "#16161a", border: "1px solid #2a2a30", borderRadius: 10, padding: 16, margin: "16px 0" };
const btn = { display: "inline-block", padding: "12px 18px", background: "#fff", color: "#000", borderRadius: 10, textDecoration: "none", fontWeight: 700, margin: "6px 8px 6px 0" };
export default async function Pack({ searchParams }) {
  if (searchParams?.session_id) await fulfillCheckout(searchParams.session_id); // idempotent; webhook does the same
  const v = await verify(searchParams);
  if (!v.ok) return <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
    <h1>Find your Receipts Pack</h1>
    {searchParams?.email || searchParams?.session_id ? <p style={{ color: "#f88" }}>No completed payment found for that. Check the email you used at checkout, or reply to your Stripe receipt and we will sort it.</p>
      : <p style={{ color: "#ccc" }}>Already bought the pack? Enter the email you paid with and we will open your copy.</p>}
    <form method="get" action="/pack" style={{ display: "flex", gap: 8, margin: "16px 0" }}>
      <input name="email" type="email" required placeholder="you@example.com" style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #444", background: "#111", color: "#fff" }} />
      <button style={{ ...btn, border: 0, cursor: "pointer" }}>Open my pack</button>
    </form>
    <p style={{ color: "#888", fontSize: 14 }}>Haven’t bought it yet? <a href="/bio?src=pack" style={{ color: "#fff" }}>Start with the free Step 1 →</a></p>
  </main>;
  const b = loadBundle();
  const q = `?${v.key}=${encodeURIComponent(v.val)}`;
  return <main>
    <p style={{ color: "#8f8" }}>Payment received. Thank you.</p>
    <h1>Your Receipts Pack</h1>
    <p>Bookmark this page. To come back later, open <b>receiptspack.vercel.app/pack</b> and enter the email you paid with.</p>
    <div style={box}><b>Printables</b><br />
      <a href={`/pack/file/log${q}`} style={btn}>30-day proof log (PDF)</a>
      <a href={`/pack/file/worksheets${q}`} style={btn}>Steps 1–5 worksheets (PDF)</a>
    </div>
    {b ? b.sections.map((s, i) => <section key={i}><h2 style={{ marginTop: 32 }}>{s.title}</h2><div style={box}>
      {s.paras.map((p, j) => <p key={j} style={{ color: j ? "#aaa" : "#eee" }}>{p}</p>)}
      {s.items.length > 0 && <ol>{s.items.map((it, j) => <li key={j}>{it}</li>)}</ol>}
    </div></section>) : <p style={{ color: "#f88" }}>Content bundle missing in this deployment — reply to your Stripe receipt and we will send it directly.</p>}
    <p style={{ fontSize: 12, color: "#888", marginTop: 40 }}>Receipts is a self-reflection and goal tool, not therapy or medical advice. Questions: reply to your Stripe receipt email.</p>
  </main>;
}
