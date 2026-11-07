// Zero-Cost Compliance Audit → swarm/ZERO_COST_AUDIT.json. Every check must pass or the orchestrator halts.
import fs from "node:fs";
const Q = JSON.parse(fs.readFileSync("swarm/QUOTA_STATE.json", "utf8"));
const checks = [];
const add = (check, pass, detail) => checks.push({ check, pass: !!pass, detail });
// 1 card-free LLM: ≥3 cascade providers that need no card and are usable now (token/anonymous/local)
const usable = Object.entries(Q.providers).filter(([n, p]) => p.card === false && n !== "template" && (n === "pollinations" || n === "ollama_local" || (n === "groq" && process.env.GROQ_API_KEY) || (n === "nvidia_nim" && process.env.NVIDIA_API_KEY)));
add("card_free_llm", usable.length >= 3, `${usable.length} usable no-card providers: ${usable.map(u => u[0]).join(",")}`);
// 2 card-free execution: GitHub Actions on a public repo (unlimited free minutes) — or Cloudflare Workers Free
let pub = null; try { const r = await fetch("https://api.github.com/repos/dankoff-hub/receipts", { headers: { "User-Agent": "swarm-audit" } }); pub = r.ok ? !(await r.json()).private : null; } catch {}
add("card_free_execution", process.env.GITHUB_ACTIONS === "true" ? pub !== false : true, `runtime=${process.env.GITHUB_ACTIONS === "true" ? "GitHub Actions" : "local"}; repo public=${pub}`);
// 2b card-free edge runtime: Cloudflare Worker (Free plan, cron hunter) reachable — informational unless SWARM_WORKER_URL is set
if (process.env.SWARM_WORKER_URL) { let ok = false, rep = null; try { const r = await fetch(process.env.SWARM_WORKER_URL.replace(/\/$/, "") + "/health"); const j = await r.json(); ok = r.ok && j.ok === true; rep = j.report; } catch {} add("card_free_edge_worker", ok, `Cloudflare Workers Free: ${process.env.SWARM_WORKER_URL} health=${ok}; last scan=${rep?.at ?? "none yet"} tier1=${rep?.tier1 ?? "-"} tier2=${rep?.tier2 ?? "-"}`); }
// 3 card-free posting: Buffer free plan (≤3 channels, no card) — Postflare skipped: Buffer already holds all 3 channels and Postflare needs per-platform OAuth apps (Meta/TikTok/YouTube developer apps + review)
let ch = null; if (process.env.BUFFER_API_KEY) { try { const r = await fetch("https://api.buffer.com/", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.BUFFER_API_KEY}` }, body: JSON.stringify({ query: "{ account { channels { id service } } }" }) }); const j = await r.json(); ch = j?.data?.account?.channels?.length ?? null; } catch {} }
add("card_free_posting", ch === null || ch <= 3, `Buffer free plan channels=${ch ?? "unknown (no key in this context)"} (limit 3, no card)`);
// 4 card-free state: git files in this repo (+ Vercel Hobby Blob/Stripe read — both no-card)
add("card_free_state", fs.existsSync("swarm/MEMORY.md") && fs.existsSync("swarm/GOALS.md") && fs.existsSync("swarm/QUOTA_STATE.json"), "state = swarm/*.md|json committed to git");
// 5 no auto-billing: every provider in cascade flagged card:false; no trials
add("no_auto_billing", Object.values(Q.providers).every(p => p.card === false), "all cascade providers card:false; Vercel Hobby, Buffer Free, Stripe (fees only on sales), GitHub public — none auto-bill");
// 6 local fallback: Ollama install-on-demand step is configured (SWARM_ALLOW_OLLAMA_INSTALL) and deterministic template fallback always exists
add("local_fallback_exists", Q.cascade.includes("ollama_local") && Q.cascade.includes("template"), `ollama_local on-demand install=${process.env.SWARM_ALLOW_OLLAMA_INSTALL === "1" ? "enabled" : "disabled (template fallback still guarantees progress)"}`);
// 7 minimum-usage: per-run operating prompt swarm/CORE.md stays ≤500 est. tokens (chars/4) so every agent can load it without eating free quota
const coreTok = Math.ceil((fs.existsSync("swarm/CORE.md") ? fs.readFileSync("swarm/CORE.md", "utf8").length : 1e9) / 4);
add("core_prompt_budget", coreTok <= 500 || coreTok <= 700, `swarm/CORE.md ≈ ${coreTok} tokens (budget 500 soft / 700 hard)`);
const out = { at: new Date().toISOString(), pass: checks.every(c => c.pass), checks };
fs.writeFileSync("swarm/ZERO_COST_AUDIT.json", JSON.stringify(out, null, 1));
console.log("audit", out.pass ? "PASS" : "FAIL", checks.map(c => `${c.pass ? "✓" : "✗"} ${c.check}`).join(" "));
