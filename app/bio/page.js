const PAY="https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
const btn={display:"block",padding:"16px 24px",background:"#fff",color:"#000",borderRadius:12,textDecoration:"none",fontWeight:700,fontSize:18,textAlign:"center",margin:"16px 0 8px 0"};
const btn2={display:"block",padding:"14px 24px",background:"transparent",color:"#fff",border:"1px solid #555",borderRadius:12,textDecoration:"none",fontWeight:600,fontSize:16,textAlign:"center",margin:"8px 0"};
const card={background:"#16161a",border:"1px solid #2a2a30",borderRadius:12,padding:16,margin:"12px 0"};
const clean=s=>String(s||"").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,40);
export const metadata={title:"Receipts by Rosa",description:"They said you weren't ready. Keep the receipt. A private 30-day system that turns being underestimated into proof."};
export default function Bio({searchParams}){
const src=clean(searchParams?.src)||"bio";
const pay=PAY+"?client_reference_id="+src;
const free="/free?src="+src;
return <main style={{maxWidth:420,margin:"0 auto",padding:16}}>
<p style={{letterSpacing:3,fontSize:11,color:"#888",textAlign:"center",marginBottom:8}}>RECEIPTS · BY ROSA</p>
<h1 style={{fontSize:32,lineHeight:1.15,textAlign:"center",margin:"0 0 12px 0"}}>They said you weren’t ready. Keep the receipt.</h1>
<p style={{fontSize:16,color:"#ccc",textAlign:"center",marginBottom:20}}>Then spend 30 days making it irrelevant. A private system that turns being underestimated into proof you can see.</p>

<a href={free} style={btn}>Get the free receipt template →</a>
<p style={{fontSize:13,color:"#888",textAlign:"center",margin:"0 0 8px 0"}}>Free · no sign-up · takes 10 minutes</p>
<a href={pay} style={btn2}>Get the full 30-day pack — $29</a>
<p style={{fontSize:13,color:"#888",textAlign:"center",marginBottom:28}}>One-time payment · instant access</p>

<div style={card}>
<b>Free vs full pack</b>
<ul style={{color:"#bbb",margin:"8px 0 0 20px",padding:0}}>
<li><b>Free:</b> Step 1, the private receipt template</li>
<li><b>$29:</b> Steps 2–5: the standard converter, the 30-day proof plan and daily log, the Arrival Check, and the 7-day bridge to your next goal</li>
</ul>
</div>

<div style={card}>
<b>How it works</b>
<ol style={{color:"#bbb",margin:"8px 0 0 20px",padding:0}}>
<li>Write the receipt: what they said, once, privately</li>
<li>Turn it into one standard you control (“apply to 10 roles”, “train 4×/week”)</li>
<li>Log proof daily, with minimum days so one bad day never breaks the streak</li>
<li>Arrival Check: decide what you keep after you’ve proved it</li>
</ol>
</div>

<div style={card}>
<b>Why it works</b>
<p style={{color:"#bbb",margin:"8px 0 0 0"}}>Doubt gets you started. A standard keeps you going. Most people stall right after proving them wrong. Receipts plans for that part too.</p>
</div>

<a href={free} style={btn}>Start with the free template →</a>
<p style={{fontSize:12,color:"#666",textAlign:"center",marginTop:32}}>Not therapy. No contacting or targeting other people.</p>
</main>}
