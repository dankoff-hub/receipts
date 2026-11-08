import { C, btn, card, eyebrow, h1, h2, sub, small, link } from "./theme";
import { withRef } from "../lib/attrib";
const PAY="https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
const faq=[
["Is this about revenge?","No. You never contact, name, or target anyone. The receipt is private fuel; the standard is yours."],
["What do I actually get?","A step-by-step 30-day system: receipt template, standard converter, proof plan, daily log, Arrival Check, and a 7-day bridge to your next goal. Delivered instantly after payment."],
["Why not just use a habit tracker?","Trackers count checkmarks. Receipts starts with the reason you care — being doubted — and handles the part trackers ignore: what to do after you’ve proved it."],
["What happens after I prove them wrong?","That’s where most people stall. The Arrival Check and 7-day bridge turn the win into a standard you keep, without needing anyone’s doubt."],
["Is this therapy?","No. It’s a self-reflection and goal system, not medical or mental-health treatment."]];
export default function H(){
const pay=PAY+"?client_reference_id="+withRef("home");return <main>
<p style={eyebrow}>Receipts</p>
<h1 style={{...h1,fontSize:42,margin:"6px 0 14px"}}>Turn getting underestimated into a standard you keep.</h1>
<p style={sub}>Passed over. Compared. Told you weren’t ready. Keep the receipt — then spend 30 days making it irrelevant.</p>
<a href={pay} style={btn}>Get the Receipts Pack — $29</a>
<p style={{...small,marginTop:10}}>One-time payment · instant access</p>
<p style={{fontSize:15}}><a href="/free?src=home" style={link}>Not ready? Start with the free receipt template →</a></p>
	<p style={{fontSize:15}}><a href="/card?src=home" style={link}>Or make a shareable receipt card →</a></p>

<h2 style={h2}>How it works</h2>
{[["1. Receipt","Write down exactly what was said or done. Privately. Once."],
["2. Standard","Convert it into one action you control: “apply to 10 roles”, “train 4×/week”, “publish 12 pieces”."],
["3. Proof","30 days of logged evidence, with minimum days so one bad day never breaks you."],
["4. Arrival Check","When you’ve proved it, decide what you keep — so the win doesn’t turn into “now what?”"]].map(([t,d])=><div key={t} style={card}><b>{t}</b><div style={{color:C.body}}>{d}</div></div>)}

<h2 style={h2}>Why it works</h2>
<p style={{color:C.body,fontSize:17}}>Spite is a powerful start and a terrible finish. People who run on “I’ll show them” often hit the goal and then stall. Receipts uses the doubt for ignition, then moves you to a standard that belongs to you.</p>

<h2 style={h2}>FAQ</h2>
{faq.map(([q,a])=><div key={q} style={card}><b>{q}</b><div style={{color:C.body}}>{a}</div></div>)}

<div style={{margin:"40px 0 16px"}}><a href={pay} style={btn}>Start your 30 days — $29</a></div>
<p style={small}><a href="/pricing" style={{color:C.muted}}>Pricing</a> · <a href="/privacy" style={{color:C.muted}}>Privacy</a></p></main>}
