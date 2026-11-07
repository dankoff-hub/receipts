import { withRef } from "../../lib/attrib";
const PAY="https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
import { C, btnBlock as btn, btnGhost as btn2, card, eyebrow, h1, link, chip } from "../theme";
const clean=s=>String(s||"").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,40);
export const metadata={title:"Receipts by Rosa",description:"They said you weren't ready. Keep the receipt. A private 30-day system that turns being underestimated into proof."};
export default function Bio({searchParams}){
const src=withRef(clean(searchParams?.src)||"bio");
const pay=PAY+"?client_reference_id="+src;
const free="/free?src="+src;
return <main style={{maxWidth:420,margin:"0 auto",padding:16}}>
<p style={{...eyebrow,textAlign:"center",marginBottom:8}}>Receipts · by Rosa</p>
<h1 style={{...h1,fontSize:34,textAlign:"center",margin:"0 0 12px 0"}}>They said you weren’t ready. Keep the receipt.</h1>
<p style={{fontSize:16,color:C.body,textAlign:"center",marginBottom:20}}>Then spend 30 days making it irrelevant. A private system that turns being underestimated into proof you can see.</p>

<a href={free} style={btn}>Get the free receipt template →</a>
<p style={{fontSize:13,color:C.muted,textAlign:"center",margin:"0 0 8px 0"}}>Free · no sign-up · takes 10 minutes</p>
<a href={pay} style={btn2}>Get the full 30-day pack — $29</a>
<p style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:28}}>One-time payment · no subscription · Stripe checkout → your pack opens instantly, no account</p>

<div style={card}>
<b>Free vs full pack</b>
<ul style={{color:C.body,margin:"8px 0 0 20px",padding:0}}>
<li><b>Free:</b> Step 1, the private receipt template</li>
<li><b>$29:</b> Steps 2–5: the standard converter, the 30-day proof plan and daily log, the Arrival Check, and the 7-day bridge to your next goal</li>
</ul>
</div>

<div style={card}>
<b>How it works</b>
<ol style={{color:C.body,margin:"8px 0 0 20px",padding:0}}>
<li>Write the receipt: what they said, once, privately</li>
<li>Turn it into one standard you control (“apply to 10 roles”, “train 4×/week”)</li>
<li>Log proof daily, with minimum days so one bad day never breaks the streak</li>
<li>Arrival Check: decide what you keep after you’ve proved it</li>
</ol>
</div>

<div style={card}>
<b>Why it works</b>
<p style={{color:C.body,margin:"8px 0 0 0"}}>Doubt gets you started. A standard keeps you going. Most people stall right after proving them wrong. Receipts plans for that part too.</p>
</div>

<div style={card}>
<b>Watch me do it</b>
<p style={{color:C.body,margin:"8px 0 4px 0"}}>I am on the same 30 days, in public, one receipt a day.</p><div><a href="https://instagram.com/danrossi2026" style={chip}>Instagram</a><a href="https://www.youtube.com/@DanRosa-u5v" style={chip}>YouTube</a><a href="https://bsky.app/profile/danrossi2026.bsky.social" style={chip}>Bluesky</a></div>
</div>

<a href={free} style={btn}>Start with the free template →</a>
</main>}
