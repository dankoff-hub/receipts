const PAY="https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
const btn={display:"block",padding:"16px 24px",background:"#fff",color:"#000",borderRadius:12,textDecoration:"none",fontWeight:700,fontSize:18,textAlign:"center",margin:"20px 0"};
const card={background:"#16161a",border:"1px solid #2a2a30",borderRadius:12,padding:16,margin:"12px 0"};
export default function Bio(){return <main style={{maxWidth:420,margin:"0 auto",padding:16}}>
<p style={{letterSpacing:3,fontSize:11,color:"#888",textAlign:"center",marginBottom:8}}>RECEIPTS</p>
<h1 style={{fontSize:32,lineHeight:1.15,textAlign:"center",margin:"0 0 12px 0"}}>Turn getting underestimated into a standard you keep.</h1>
<p style={{fontSize:16,color:"#ccc",textAlign:"center",marginBottom:24}}>The 30-day system that converts rejection into proof.</p>

<a href={PAY} style={btn}>Get the Receipts Pack — $29</a>
<p style={{fontSize:13,color:"#888",textAlign:"center",marginBottom:32}}>One-time payment · Instant access</p>

<div style={card}>
<b>What you get</b>
<ul style={{color:"#bbb",margin:"8px 0 0 20px",padding:0}}>
<li>Private receipt template</li>
<li>Standard converter (emotion → action)</li>
<li>30-day proof plan with daily log</li>
<li>Arrival Check + 7-day bridge</li>
<li>Delivered instantly after payment</li>
</ul>
</div>

<div style={card}>
<b>How it works</b>
<ol style={{color:"#bbb",margin:"8px 0 0 20px",padding:0}}>
<li>Write the receipt (what they said, once, privately)</li>
<li>Convert it into a 30-day standard you control</li>
<li>Log proof daily for 30 days</li>
<li>Arrival Check: decide what you keep</li>
</ol>
</div>

<div style={card}>
<b>Why it works</b>
<p style={{color:"#bbb",margin:"8px 0 0 0"}}>Spite gets you started. A standard keeps you going. Most people stall after proving them wrong. Receipts bridges the gap.</p>
</div>

<a href={PAY} style={btn}>Start your 30 days — $29</a>
<p style={{fontSize:12,color:"#666",textAlign:"center",marginTop:32}}>Not therapy. No contacting or targeting other people.<br/>Questions? Reply to your Stripe receipt email.</p>
</main>}
