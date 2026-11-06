import { verify, loadBundle } from "../../../../lib/pack";
export const dynamic = "force-dynamic";
export async function GET(req, { params }) {
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const v = await verify(sp);
  if (!v.ok) return new Response("Payment not found. Open /pack and enter the email you paid with.", { status: 403 });
  const b = loadBundle(); const f = b?.files?.[params.name];
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(f.b64, "base64"), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${f.filename}"`, "Cache-Control": "private, no-store" } });
}
