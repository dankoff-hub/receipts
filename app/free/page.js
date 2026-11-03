const PAY="https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
const btn={display:"block",padding:"16px 24px",background:"#fff",color:"#000",borderRadius:12,textDecoration:"none",fontWeight:700,fontSize:18,textAlign:"center",margin:"20px 0 8px 0"};
const box={background:"#16161a",border:"1px solid #2a2a30",borderRadius:12,padding:16,margin:"16px 0"};
const clean=s=>String(s||"").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,40);
export const metadata={title:"Free receipt template · Receipts",description:"Step 1 of the Receipts system, free. Write the receipt in 10 minutes."};
export default function Free({searchParams}){
const src=clean(searchParams?.src)||"free";
const pay=PAY+"?client_reference_id=free_"+src;
return <main style={{maxWidth:520,margin:"0 auto",padding:16}}>
<p style={{letterSpacing:3,fontSize:11,color:"#888",marginBottom:8}}>RECEIPTS · FREE STEP 1</p>
<h1 style={{fontSize:30,lineHeight:1.15,margin:"0 0 12px 0"}}>Write the receipt (10 minutes)</h1>
<p style={{color:"#ccc"}}>Use paper, your notes app or a doc. Write each answer once, then close it. Nobody else sees this.</p>

<div style={box}><ol style={{margin:"0 0 0 20px",padding:0,lineHeight:1.6}}>
<li>What was said or done? Write it exactly, once.</li>
<li>When did it happen?</li>
<li>What did it make you feel? (dismissed, compared, rejected, underestimated, angry)</li>
<li>What does this make you want to prove?</li>
<li>What would make this irrelevant in 90 days?</li>
</ol>
<p style={{color:"#aaa",marginBottom:0}}>Rule: the receipt is about your standard, not about them. Never contact, name publicly or target the person.</p></div>

<h2 style={{marginTop:32}}>Done? Here’s where most people stop.</h2>
<p style={{color:"#ccc"}}>Writing it down feels good for a day. Without a plan, the feeling fades and nothing changes. The full pack turns answer 4 into a 30-day standard you actually follow.</p>

<div style={box}>
<b>The full pack adds:</b>
<ul style={{color:"#bbb",margin:"8px 0 0 20px",padding:0,lineHeight:1.6}}>
<li><b>Standard converter:</b> turn the feeling into one action you control, plus a “minimum day” for bad days</li>
<li><b>30-day proof plan:</b> week-by-week steps and a daily proof log</li>
<li><b>Arrival Check:</b> what to keep once you’ve proved it</li>
<li><b>7-day bridge:</b> moving to your next standard without stalling</li>
</ul>
</div>

<a href={pay} style={btn}>Turn your receipt into a 30-day plan — $29</a>
<p style={{fontSize:13,color:"#888",textAlign:"center"}}>One-time payment · instant access</p>

<p style={{fontSize:12,color:"#666",textAlign:"center",marginTop:32}}>Not therapy or medical advice. No contacting or targeting other people.</p>
</main>}
