import { C, btnBlock, card, eyebrow, h1, small, link } from "../theme";
import { withRef } from "../../lib/attrib";
const PAY="https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
export const metadata={title:"Pricing · Receipts Pack"};
export default function P({searchParams}){
const src=withRef(String(searchParams?.src||"pricing").replace(/[^a-z0-9_-]/gi,"").slice(0,40));
return <main style={{maxWidth:520,margin:"0 auto"}}>
<p style={eyebrow}>Receipts · Pricing</p>
<h1 style={{...h1,fontSize:34,margin:"6px 0 10px"}}>One price. One payment. The whole system.</h1>
<p style={{color:C.body,fontSize:17}}>Step 1 is free. Steps 2–5 are the pack.</p>
<div style={{...card,padding:24,marginTop:20,borderColor:C.primary}}>
<div style={{display:"flex",alignItems:"baseline",gap:10}}><span style={{fontFamily:"var(--font-head),Georgia,serif",fontSize:44,fontWeight:700,color:C.ink}}>$29</span><span style={{color:C.muted}}>one-time · no subscription</span></div>
<ul style={{color:C.body,margin:"14px 0 0 20px",padding:0,lineHeight:1.7}}>
<li>Private receipt log (Step 1, also free)</li><li>Rejection-to-standard converter with “minimum day” rule</li><li>30-day proof plan and daily proof log (PDF)</li><li>Arrival Check and 7-day bridge to your next standard</li><li>Printable worksheets for all five steps</li></ul>
<a href={PAY+"?client_reference_id="+src} style={btnBlock}>Get the Receipts Pack — $29</a>
<p style={{...small,textAlign:"center",margin:0}}>Secure Stripe checkout (card, Apple Pay, Google Pay) → your pack opens instantly. No account to create.</p>
</div>
<p style={{fontSize:15,marginTop:20}}>Not ready? <a href={"/free?src="+src} style={link}>Start with the free Step 1 template →</a></p>
<p style={{...small,marginTop:28}}>Receipts is a self-reflection and goal tool, not therapy or medical advice. <a href="/privacy" style={{color:C.muted}}>Privacy</a></p>
</main>}
