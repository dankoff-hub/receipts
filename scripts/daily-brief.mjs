import fs from "node:fs";
import { execSync } from "node:child_process";
const SITE = "https://receipts-blond.vercel.app";
const md = fs.readFileSync("content/launch-scripts.md", "utf8");
const scripts = [...md.matchAll(/## (\d+)\. (.+)\n- Hook[^\n]*\n- Body: (.+)\n- CTA: (.+)/g)].map(m => ({ n: +m[1], hook: m[2], body: m[3], cta: m[4] }));
const start = new Date("2026-11-04T00:00:00Z");
const day = Math.max(0, Math.floor((Date.now() - start) / 86400000));
const s = scripts[day % scripts.length];
const health = await fetch(SITE + "/api/health").then(r => r.status).catch(() => "down");
const stripeOk = await fetch(SITE).then(r => r.text()).then(t => t.includes("buy.stripe.com")).catch(() => false);
const tags = "#provethemwrong #selfimprovement #careertok #motivation #discipline #30daychallenge";
const body = `## Today's TikTok (Day ${day + 1}, script ${s.n})

**Hook (say it + on-screen text, first 2 seconds):**
> ${s.hook}

**What to say (20–40s):** ${s.body}

**End line:** ${s.cta}

**Caption:**
${s.hook} — the 30-day Receipts system, link in bio.
${tags}

**Rules:** never show or name a real person. Film vertical, face to camera or text-over-b-roll.

---
**Site check:** health ${health === 200 ? "OK" : "FAILED (" + health + ")"} · Stripe button ${stripeOk ? "present" : "MISSING"} · ${SITE}

**Your 2-minute follow-up:** reply here with views / clicks / sales so the weekly review can use it.`;
const title = `Post today: Day ${day + 1} — ${s.hook}`;
fs.writeFileSync("/tmp/body.md", body);
execSync(`gh issue create --title ${JSON.stringify(title)} --body-file /tmp/body.md --label daily-brief`, { stdio: "inherit" });
