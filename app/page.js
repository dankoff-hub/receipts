const PAY="https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
const btn={display:"inline-block",padding:"14px 22px",background:"#fff",color:"#000",borderRadius:8,textDecoration:"none",fontWeight:600};
const card={background:"#16161a",border:"1px solid #2a2a30",borderRadius:10,padding:16,margin:"12px 0"};
const faq=[
["Is this about revenge?","No. You never contact, name, or target anyone. The receipt is private fuel; the standard is yours."],
["What do I actually get?","A step-by-step 30-day system: receipt template, standard converter, proof plan, daily log, Arrival Check, and a 7-day bridge to your next goal. Delivered instantly after payment."],
["Why not just use a habit tracker?","Trackers count checkmarks. Receipts starts with the reason you care — being doubted — and handles the part trackers ignore: what to do after you’ve proved it."],
["What happens after I prove them wrong?","That’s where most people stall. The Arrival Check and 7-day bridge turn the win into a standard you keep, without needing anyone’s doubt."],
["Is this therapy?","No. It’s a self-reflection and goal system, not medical or mental-health treatment."]];
export default function H(){return <main>
<p style={{letterSpacing:2,fontSize:12,color:"#888"}}>RECEIPTS</p>
<h1 style={{fontSize:40,lineHeight:1.1}}>Turn getting underestimated into a standard you keep.</h1>
<p style={{fontSize:18,color:"#ccc"}}>Passed over. Compared. Told you weren’t ready. Keep the receipt — then spend 30 days making it irrelevant.</p>
<a href={PAY} style={btn}>Get the Receipts Pack — $29</a>
<p style={{fontSize:13,color:"#888"}}>One-time payment · instant access · <span style={{color:"#f2c94c"}}>30-day money-back guarantee</span></p>
<p style={{fontSize:14}}><a href="/free?src=home" style={{color:"#fff"}}>Not ready? Start with the free receipt template →</a></p>

<h2 style={{marginTop:40}}>How it works</h2>
{[["1. Receipt","Write down exactly what was said or done. Privately. Once."],
["2. Standard","Convert it into one action you control: “apply to 10 roles”, “train 4×/week”, “publish 12 pieces”."],
["3. Proof","30 days of logged evidence, with minimum days so one bad day never breaks you."],
["4. Arrival Check","When you’ve proved it, decide what you keep — so the win doesn’t turn into “now what?”"]].map(([t,d])=><div key={t} style={card}><b>{t}</b><div style={{color:"#bbb"}}>{d}</div></div>)}

<h2 style={{marginTop:40}}>Why it works</h2>
<p style={{color:"#ccc"}}>Spite is a powerful start and a terrible finish. People who run on “I’ll show them” often hit the goal and then stall. Receipts uses the doubt for ignition, then moves you to a standard that belongs to you.</p>

<h2 style={{marginTop:40}}>FAQ</h2>
{faq.map(([q,a])=><div key={q} style={card}><b>{q}</b><div style={{color:"#bbb"}}>{a}</div></div>)}

<div style={{margin:"40px 0"}}><a href={PAY} style={btn}>Start your 30 days — $29</a></div>
<p><a href="/pricing" style={{color:"#aaa"}}>Pricing</a></p></main>}
