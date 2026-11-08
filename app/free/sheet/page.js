// Printable Step 1 sheet — the free deliverable, delivered instantly (no email gate). Print-friendly: light background.
export const metadata={title:"Step 1 sheet · Receipts",robots:{index:false}};
const Q=["What was said or done? Write it exactly, once.","When did it happen?","What did it make you feel? (dismissed, compared, rejected, underestimated, angry)","What does this make you want to prove?","What would make this irrelevant in 90 days?","If that sentence shows up again, then I will ______ (one counted action)."];
export default function Sheet({searchParams}){
const src=String(searchParams?.src||"sheet").replace(/[^a-z0-9_-]/gi,"").slice(0,40);
return <main style={{background:"#fff",color:"#111",maxWidth:680,margin:"0 auto",borderRadius:12,border:"1px solid #E3DBCD",padding:"32px 28px",fontFamily:"system-ui"}}>
<p style={{letterSpacing:3,fontSize:12,color:"#5F5A52",margin:0}}>RECEIPTS · STEP 1 OF 5 · THE RECEIPT</p>
<h1 style={{fontSize:26,margin:"6px 0 4px 0"}}>Write it once. Then write the if-then.</h1>
<p style={{color:"#555",margin:"0 0 20px 0",fontSize:14}}>Private. About your standard, not about them. Never contact, name publicly or target the person. Date the first line. Tomorrow is enough.</p>
{Q.map((q,i)=><div key={i} style={{margin:"0 0 18px 0"}}><b style={{fontSize:15}}>{i+1}. {q}</b>
<div style={{height:i===0?110:i===3||i===4||i===5?96:52,border:"1px solid #999",borderRadius:6,marginTop:6}} /></div>)}
<div style={{borderTop:"1px solid #ccc",paddingTop:12,display:"flex",justifyContent:"space-between",fontSize:12,color:"#666"}}>
<span>Date: ____________</span><span>Done? Go back to receiptspack.vercel.app/free — Step 2 is the one-time $29 pack, not this page.</span></div>
<p className="np" style={{marginTop:24,fontSize:14}}><a href={"/free?src="+src} style={{color:"#111",display:"inline-block",padding:"10px 0"}}>← Back</a> · Use your browser’s Print or “Save as PDF”.</p>
<style>{`@media print{.np{display:none}body{background:#fff!important;padding:0!important}}`}</style>
</main>}
