const clean = (s) => String(s || "You are not ready.").replace(/[<>&"]/g, "").replace(/\s+/g, " ").trim().slice(0, 90);

export function GET(req) {
  const line = clean(new URL(req.url).searchParams.get("line"));
  const words = escapeXml(line).split(" ");
  const rows = [];
  let row = "";
  for (const w of words) {
    if ((row + " " + w).trim().length > 28) { rows.push(row); row = w; } else row = (row + " " + w).trim();
  }
  if (row) rows.push(row);
  const lines = rows.slice(0, 3).map((t, i) => `<text x="88" y="${230 + i * 68}" fill="#17161A" font-family="Georgia, serif" font-size="52">${t}</text>`).join("");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#17161A"/>
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="#F6F1E8"/>
  <text x="88" y="120" fill="#C77A00" font-family="Georgia, serif" font-size="22" letter-spacing="6">RECEIPT · DAY 0</text>
  ${lines}
  <text x="88" y="500" fill="#3A3732" font-family="Georgia, serif" font-size="26">Kept. Not answered. 30 days to make it irrelevant.</text>
  <text x="88" y="544" fill="#0F4C3A" font-family="Georgia, serif" font-size="22">receiptspack.vercel.app/free</text>
</svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=86400" } });
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
