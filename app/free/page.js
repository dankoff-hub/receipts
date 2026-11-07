import Capture from "./Capture";
import { Bar, Tick } from "./Progress";
const PAY="https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
import { C, btnBlock as btn, card as box, eyebrow, h1, link } from "../theme";
const clean=s=>String(s||"").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,40);
// Where the visitor came from decides the first line they read (message match: the video they just watched → the page).
const FROM={ig:"Instagram",instagram:"Instagram",tt:"TikTok",tiktok:"TikTok",yt:"YouTube",youtube:"YouTube",bsky:"Bluesky",masto:"Mastodon",skool:"Skool",bio:""};
export const metadata={title:"Free receipt template · Receipts",description:"Step 1 of the Receipts system, free. Write the receipt in 10 minutes."};
export default function Free({searchParams}){
const src=clean(searchParams?.src)||"free";
const pay=PAY+"?client_reference_id=free_"+src;
const from=FROM[src.replace(/^free_/,"")]??"";
return <main style={{maxWidth:520,margin:"0 auto",padding:16}}>
<p style={{...eyebrow,marginBottom:8}}>Receipts · Free Step 1</p>
<Bar />
<h1 style={{...h1,fontSize:32,margin:"0 0 12px 0"}}>{from?`You saw the daily receipt on ${from}. Here is Step 1.`:"Write the receipt (10 minutes)"}</h1>
<p style={{color:C.body}}>Five questions. Paper, notes app or a doc. Write each answer once, then close it. Nobody else sees this. No sign-up.</p>

<div style={box}><ol style={{margin:"0 0 0 20px",padding:0,lineHeight:1.6}}>
<li>What was said or done? Write it exactly, once.</li>
<li>When did it happen?</li>
<li>What did it make you feel? (dismissed, compared, rejected, underestimated, angry)</li>
<li>What does this make you want to prove?</li>
<li>What would make this irrelevant in 90 days?</li>
</ol>
<p style={{color:C.muted,marginBottom:0}}>Rule: the receipt is about your standard, not about them. Never contact, name publicly or target the person.</p>
<a href={"/free/sheet?src="+src} style={{display:"inline-block",marginTop:12,color:C.primary,fontWeight:700,textDecoration:"underline",textUnderlineOffset:3}}>Open the printable Step 1 sheet →</a>
</div>

<Tick pay={pay} />

<div style={box}><b>Want a day-1 nudge?</b><p style={{color:C.muted,margin:"6px 0 0 0",fontSize:14}}>Leave your email and I will remind you once, on day 1. Nothing else.</p><Capture src={src} /></div>

<h2 style={{marginTop:32,fontSize:26}}>Here is where most people stop.</h2>
<p style={{color:C.body}}>Writing it down feels good for a day. Without a plan, the feeling fades and nothing changes. The full pack turns your answer to question 4 into a 30-day standard you actually follow.</p>

<div style={box}>
<b>The full pack adds (Steps 2–5):</b>
<ul style={{color:C.body,margin:"8px 0 0 20px",padding:0,lineHeight:1.6}}>
<li><b>Standard converter:</b> turn the feeling into one action you control, plus a “minimum day” for bad days</li>
<li><b>30-day proof plan:</b> week-by-week steps and a daily proof log (PDF)</li>
<li><b>Arrival Check:</b> what to keep once you’ve proved it</li>
<li><b>7-day bridge:</b> moving to your next standard without stalling</li>
</ul>
</div>

<a href={pay} style={btn}>Turn your receipt into a 30-day plan — $29</a>
<p style={{fontSize:13,color:C.muted,textAlign:"center",margin:"0 0 4px 0"}}>One-time payment · no subscription · instant access</p>
<p style={{fontSize:13,color:C.muted,textAlign:"center"}}>What happens next: secure Stripe checkout (card, Apple Pay, Google Pay) → your pack page opens immediately with all five steps and the PDFs. No account to create. Come back any time with the email you paid with.</p>

<div style={{...box,marginTop:28}}>
<b>I am doing the 30 days in public.</b>
<p style={{color:C.body,margin:"8px 0 0 0"}}>One receipt a day, same system. Watch it hold or break: <a href="https://instagram.com/danrossi2026" style={link}>Instagram</a> · <a href="https://www.youtube.com/@DanRosa-u5v" style={link}>YouTube</a> · <a href="https://bsky.app/profile/danrossi2026.bsky.social" style={link}>Bluesky</a></p>
</div>
<p style={{fontSize:12,color:C.faint,marginTop:24}}>Receipts is a self-reflection and goal tool, not therapy or medical advice. <a href="/privacy" style={{color:C.muted}}>Privacy</a></p>
</main>}
