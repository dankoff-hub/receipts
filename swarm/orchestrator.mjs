// Orchestrator — one cron cycle: audit → quota → hunter → closer (draft-only unless CLOSER_SEND=1) → creative → attribution → report → memory. Checkpoints to swarm/CHECKPOINT.json.
import fs from "node:fs";
import { execSync } from "node:child_process";
import { Q, saveQuota, reloadQuota } from "./llm.mjs";
const sh = (c) => execSync(c, { stdio: ["ignore", "pipe", "inherit"], env: process.env }).toString();
const CK = "swarm/CHECKPOINT.json"; const ck = fs.existsSync(CK) ? JSON.parse(fs.readFileSync(CK, "utf8")) : {};
const cycle = new Date().toISOString(); const stage = s => { ck.stage = s; ck.at = new Date().toISOString(); fs.writeFileSync(CK, JSON.stringify(ck, null, 1)); console.log(`[${s}]`); };

// 0) compliance audit — halt if any check fails
stage("audit"); sh("node swarm/audit.mjs");
const audit = JSON.parse(fs.readFileSync("swarm/ZERO_COST_AUDIT.json", "utf8"));
if (!audit.pass) { console.log("AUDIT FAILED — swarm halted until remediated:", audit.checks.filter(c => !c.pass).map(c => c.check)); process.exit(1); }

// 1) quota: rotate cascade start, clear expired cooldowns
stage("quota"); Q.rotation_offset = (Q.rotation_offset + 1) % 4; const now = Date.now(); for (const p of Object.values(Q.providers)) if (p.cooldown_until && p.cooldown_until < now) p.cooldown_until = 0; saveQuota();
const live = Object.entries(Q.providers).filter(([n, p]) => n !== "template" && !p.cooldown_until).length;
if (live === 0) { console.log("all providers cooling down — exhausted; resume next cron"); Q.exhausted_at = cycle; saveQuota(); process.exit(0); }

// 2) hunter  3) creative
stage("hunter"); try { process.stdout.write(sh("node swarm/hunter.mjs")); } catch (e) { console.log("hunter error", e.message); }
stage("closer"); try { process.stdout.write(sh("node swarm/closer.mjs")); } catch (e) { console.log("closer error", e.message); }
stage("creative"); try { sh("node swarm/creative.mjs"); } catch (e) { console.log("creative error", e.message); }
reloadQuota(); saveQuota();

// 4) attribution — Stripe (read) + post log
stage("attribution");
const KEY = process.env.STRIPE_API_KEY; let paid = [], sessErr = null;
if (KEY) { try { const j = await fetch("https://api.stripe.com/v1/checkout/sessions?limit=100", { headers: { Authorization: `Bearer ${KEY}` } }).then(r => r.json()); if (j.error) sessErr = j.error.message; paid = (j.data || []).filter(s => s.payment_status === "paid"); } catch (e) { sessErr = e.message; } }
const revenue = paid.reduce((a, s) => a + (s.amount_total || 0), 0) / 100;
const bySrc = {}; for (const s of paid) bySrc[s.client_reference_id || "direct"] = (bySrc[s.client_reference_id || "direct"] || 0) + (s.amount_total || 0) / 100;
const postLog = (() => { try { return JSON.parse(fs.readFileSync("content/post-log.json", "utf8")); } catch { return []; } })();
const posts24 = (Array.isArray(postLog) ? postLog : postLog.posts || []).filter(p => Date.parse(p.at || p.date || p.sentAt || 0) > now - 86400e3).length;
const hunter = (() => { try { return JSON.parse(fs.readFileSync("swarm/_hunter_cycle.json", "utf8")); } catch { return {}; } })();
const leads = JSON.parse(fs.readFileSync("swarm/LEADS.json", "utf8"));
const openT1 = leads.leads.filter(l => l.tier === 1 && l.status === "new");
const concepts = (() => { try { const c = JSON.parse(fs.readFileSync("swarm/CONCEPTS.json", "utf8")); return c.days[cycle.slice(0, 10)] || []; } catch { return []; } })();

// 5) report
stage("report");
const target = 50000, pct = (revenue / target * 100).toFixed(2);
const prov = Object.entries(Q.providers).map(([n, p]) => `${n}:${p.calls}/${p.fails}${p.cooldown_until ? "⏸" : ""}`).join(" ");
const rep = `# REVENUE SWARM REPORT — ${cycle}
## Primary
- Attributed revenue: **$${revenue.toFixed(2)}** / $${target} (${pct}%)${sessErr ? ` — Stripe read error: ${sessErr}` : ""}
- Revenue by src: ${Object.keys(bySrc).length ? JSON.stringify(bySrc) : "none yet"}
- Paid sessions: ${paid.length} · posts last 24h: ${posts24}
- Hunter this cycle: scanned ${hunter.scanned ?? 0} → Tier1 ${hunter.tier1 ?? 0}, Tier2 ${hunter.tier2 ?? 0} (LLM calls ${hunter.llmCalls ?? 0}) · open Tier1 awaiting human-approved reply: ${openT1.length}
- Creative today: ${concepts.length} concepts (${[...new Set(concepts.map(c => c.provider))].join(",") || "-"}) → content/swarm-scripts.md
- Time-to-first-revenue-touch: ${paid.length ? "achieved" : "not yet — 0 paid sessions since launch"}
## Cascade / quota (calls/fails)
${prov}
## Top intent posts (public, read-only; replies need founder-owned accounts → High risk, human approval)
${(hunter.top || []).map(t => `- T${t.tier} ${t.src}: ${t.text.replace(/\s+/g, " ")} — ${t.url}`).join("\n") || "- none this cycle"}
## Zero-cost audit: ${audit.pass ? "PASS" : "FAIL"} (${audit.at})
`;
fs.writeFileSync("swarm/REVENUE_SWARM_REPORT.md", rep);

// 6) memory: append cycle line; compact when long
stage("memory");
let mem = fs.readFileSync("swarm/MEMORY.md", "utf8");
mem += `\n- ${cycle.slice(0, 16)} rev $${revenue} · T1 ${hunter.tier1 ?? 0}/T2 ${hunter.tier2 ?? 0} · concepts ${concepts.length} · providers ${prov}`;
const lines = mem.split("\n"); if (lines.length > 160) { const head = lines.slice(0, 12), tail = lines.slice(-40); mem = [...head, `- (compacted ${lines.length - 52} cycle lines on ${cycle.slice(0, 10)})`, ...tail].join("\n"); }
fs.writeFileSync("swarm/MEMORY.md", mem);
ck.lastCycle = cycle; ck.revenue = revenue; stage("done");
console.log(rep);
