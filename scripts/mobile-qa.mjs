// Mobile customer-journey QA (iPhone viewport): HTTP status, horizontal overflow, tap targets < 40px, WCAG contrast, fonts < 12px,
// internal link health, Stripe payment link reachability, Step-1 tick → progress → CTA with src, subscribe API, /pack lookup.
// Exits 1 with a list of issues so the workflow goes red when the journey degrades. Read-only except one @example.com subscribe probe.
import { chromium, devices } from "playwright";
const SITE = process.env.APP_URL || "https://receiptspack.vercel.app";
const PAY = "https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();
const issues = [], notes = [];
async function audit(url, name) {
  const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  if (resp.status() !== 200) issues.push(`${name}: HTTP ${resp.status()}`);
  const r = await page.evaluate(() => {
    const out = { links: [], small: [], lowContrast: [], hscroll: document.documentElement.scrollWidth > window.innerWidth + 1, fontTooSmall: [] };
    const lum = c => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.map(Number).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }); return .2126 * r + .7152 * g + .0722 * b };
    const bgOf = el => { while (el) { const b = getComputedStyle(el).backgroundColor; if (b && b !== "rgba(0, 0, 0, 0)" && b !== "transparent") return b; el = el.parentElement } return "rgb(255,255,255)" };
    for (const a of document.querySelectorAll("a,button")) {
      const r = a.getBoundingClientRect(); if (r.width === 0) continue;
      const t = (a.innerText || "").trim().slice(0, 50);
      out.links.push({ t, href: a.getAttribute("href"), h: Math.round(r.height), w: Math.round(r.width) });
      if (r.height < 40 && getComputedStyle(a).display !== "inline") out.small.push({ t, h: Math.round(r.height) });
    }
    for (const el of document.querySelectorAll("p,li,span,b,a,h1,h2,div,button")) {
      if (el.children.length && el.children.length === el.childNodes.length) continue;
      const cs = getComputedStyle(el); const txt = (el.innerText || "").trim(); if (!txt) continue;
      const fs = parseFloat(cs.fontSize); if (fs < 12) out.fontTooSmall.push({ t: txt.slice(0, 40), fs });
      const l1 = lum(cs.color), l2 = lum(bgOf(el)); if (l1 == null || l2 == null) continue;
      const cr = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
      const big = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700);
      if (cr < (big ? 3 : 4.5)) out.lowContrast.push({ t: txt.slice(0, 40), cr: +cr.toFixed(2) });
    }
    return out;
  });
  if (r.hscroll) issues.push(`${name}: horizontal scroll on mobile`);
  for (const s of r.small) issues.push(`${name}: tap target <40px "${s.t}" (${s.h}px)`);
  for (const c of r.lowContrast.slice(0, 5)) issues.push(`${name}: contrast ${c.cr}:1 "${c.t}"`);
  for (const f of r.fontTooSmall.slice(0, 3)) issues.push(`${name}: font ${f.fs}px "${f.t}"`);
  const ctas = r.links.filter(l => l.href && /stripe|\/free|\/pricing|\/bio/.test(l.href)).length;
  if (!ctas) issues.push(`${name}: no CTA toward /free or checkout`);
  return r;
}
const pages = [["/", "home"], ["/bio?src=ig", "bio"], ["/free?src=tt", "free"], ["/free", "free_typed"], ["/free/sheet?src=tt", "sheet"], ["/pricing?src=yt", "pricing"], ["/pack", "pack"], ["/privacy", "privacy"]];
const all = {};
for (const [p, n] of pages) all[n] = await audit(SITE + p, n);
const hrefs = new Set();
for (const n in all) for (const l of all[n].links) if (l.href && (l.href.startsWith("/") || l.href.includes("stripe.com"))) hrefs.add(l.href.startsWith("/") ? SITE + l.href : l.href);
for (const h of hrefs) { try { const r = await ctx.request.get(h, { timeout: 30000 }); if (r.status() >= 400) issues.push(`link ${h} → ${r.status()}`); } catch (e) { issues.push(`link ${h} → ${e.message.slice(0, 80)}`); } }
// behaviour: tick → 20% → CTA with src
await page.goto(SITE + "/free?src=tt", { waitUntil: "networkidle" });
await page.getByText("I wrote my receipt").click().catch(() => issues.push("free: tick button missing"));
await page.waitForTimeout(500);
const after = await page.evaluate(() => ({ pct: document.body.innerText.match(/(\d+)% of the system/)?.[1], cta: [...document.querySelectorAll("a")].find(a => /Continue to Step 2/.test(a.innerText))?.href }));
if (after.pct !== "20") issues.push(`free: progress after tick = ${after.pct}`);
if (!after.cta || !after.cta.includes("client_reference_id=free_tt")) issues.push(`free: Step-2 CTA after tick lacks src: ${after.cta}`);
const sub = await ctx.request.post(SITE + "/api/subscribe", { data: { email: "qa-probe@example.com", src: "qa" } });
if (sub.status() !== 200) issues.push(`subscribe API ${sub.status()}`); else notes.push(`subscribe ok (${(await sub.text()).slice(0, 60)})`);
const pk = await ctx.request.get(SITE + "/pack?email=nobody@example.com");
if (!(await pk.text()).includes("No completed payment")) issues.push("pack lookup: unexpected response for unknown email");
const st = await ctx.request.get(PAY + "?client_reference_id=qa", { timeout: 30000 }).catch(() => null);
if (!st || st.status() !== 200) issues.push(`stripe payment link → ${st ? st.status() : "unreachable"}`);
await browser.close();
const summary = `## Mobile journey QA — ${new Date().toISOString()}\n${issues.length ? "### Issues\n" + issues.map(i => "- " + i).join("\n") : "No issues."}\n${notes.map(n => "- " + n).join("\n")}\n`;
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) (await import("node:fs")).appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
process.exit(issues.length ? 1 : 0);
