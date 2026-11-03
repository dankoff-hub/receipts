export const metadata={title:"Your Receipts Pack",robots:{index:false,follow:false}};
const box={background:"#16161a",border:"1px solid #2a2a30",borderRadius:10,padding:16,margin:"16px 0"};
const h2={marginTop:32};
export default function Pack(){return <main>
<p style={{color:"#8f8"}}>Payment received. Thank you.</p>
<h1>Your Receipts Pack</h1>
<p>Bookmark this page. It is your copy of the 30-day system. Work through it on paper, in notes, or in a doc — the method matters more than the tool.</p>

<h2 style={h2}>Step 1 — Write the receipt (10 minutes)</h2>
<div style={box}><ol>
<li>What was said or done? Write it exactly, once.</li>
<li>When did it happen?</li>
<li>What did it make you feel? (dismissed, compared, rejected, underestimated, angry)</li>
<li>What does this make you want to prove?</li>
<li>What would make this irrelevant in 90 days?</li>
</ol><p style={{color:"#aaa"}}>Rule: the receipt is about your standard, not about them. Never contact, name publicly, or target the person.</p></div>

<h2 style={h2}>Step 2 — Convert it into a standard</h2>
<div style={box}><p>Fill in: <b>“For the next 30 days I will ____ , ____ times per week, and done means ____.”</b></p>
<p>It must be an action you control. Bad: “get promoted”, “make them regret it”. Good: “apply to 10 strong roles”, “train 4×/week”, “publish 12 pieces”, “save $1,000”.</p>
<p>Also write your <b>minimum day</b>: the smallest version you will do on a bad day (e.g. 10 minutes, one application, one rep).</p></div>

<h2 style={h2}>Step 3 — The 30-day proof plan</h2>
<div style={box}><ul>
<li><b>Week 1 — Start.</b> Do the standard 3 times. Log each one.</li>
<li><b>Week 2 — Consistency.</b> Hit your weekly number. Use minimum days, never zero days.</li>
<li><b>Week 3 — Raise it.</b> One action this week should scare you a little.</li>
<li><b>Day 21 — Successor draft.</b> Write: “What ability am I building that should outlive this receipt?”</li>
<li><b>Week 4 — Finish.</b> Complete “done means”.</li>
</ul>
<p><b>Daily proof log:</b> date · what I did · what it proves · what it cost · what I learned.</p></div>

<h2 style={h2}>Step 4 — Arrival Check (when you finish)</h2>
<div style={box}><ol>
<li>What did proving this change about you?</li>
<li>What ability did you build that nobody can take away?</li>
<li>Which part of this was really about them? Which part was about you?</li>
<li>What standard do you want to keep now?</li>
</ol>
<p>Then choose one: <b>Deepen</b> (keep it, make it sustainable), <b>Expand</b> (bigger version), or <b>Redirect</b> (same discipline, new area of life).</p></div>

<h2 style={h2}>Step 5 — The 7-day bridge</h2>
<div style={box}><p>Don’t stop and don’t jump straight into another month. For 7 days: 3 small actions on your chosen path and one written reflection. On day 7, write your next 30-day standard.</p>
<p>Finally, mark the receipt: <b>Proved</b>, <b>Outgrown</b>, or <b>Released</b> — and write one line: “I keep the standard, not the grudge.”</p></div>

<p style={{fontSize:12,color:"#888",marginTop:40}}>Receipts is a self-reflection and goal tool, not therapy or medical advice. Questions or refunds: reply to your Stripe receipt email.</p>
</main>}
