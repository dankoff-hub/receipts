// LLM cascade — no-card providers only. (GitHub Models retired 2026-07-30 — removed.) OpenAI-compatible chat; on 429/5xx/timeout fall to the next provider.
// Order + cooldowns live in swarm/QUOTA_STATE.json (rotated each cycle so one provider isn't always hit first).
import fs from "node:fs";
import { execSync } from "node:child_process";
const QP = "swarm/QUOTA_STATE.json";
export const Q = JSON.parse(fs.readFileSync(QP, "utf8"));
export function reloadQuota() { const f = JSON.parse(fs.readFileSync(QP, "utf8")); for (const [n, p] of Object.entries(f.providers)) Object.assign(Q.providers[n] ??= {}, p); }
export function saveQuota() { Q.updated = new Date().toISOString(); fs.writeFileSync(QP, JSON.stringify(Q, null, 1)); }

// Offline prompt compression (deterministic, zero-cost): drop filler, collapse whitespace, clamp context.
export function compress(s, max = 1800) {
  return String(s).replace(/\b(please|kindly|basically|actually|really|very|just|in order to|note that|it is important to|make sure to)\b/gi, "")
    .replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim().slice(0, max);
}

const PROV = {
  groq: { url: "https://api.groq.com/openai/v1/chat/completions", model: process.env.GROQ_MODEL || "openai/gpt-oss-120b", key: () => process.env.GROQ_API_KEY },
  nvidia_nim: { url: "https://integrate.api.nvidia.com/v1/chat/completions", model: process.env.NVIDIA_MODEL || "google/gemma-4-31b-it", key: () => process.env.NVIDIA_API_KEY },
  pollinations: { url: "https://text.pollinations.ai/openai", model: "openai", key: () => "anonymous" },
  ollama_local: { url: "http://127.0.0.1:11434/v1/chat/completions", model: "qwen2.5:0.5b", key: () => "ollama", local: true },
};

function ensureOllama() {
  try { execSync("curl -sf http://127.0.0.1:11434/api/tags >/dev/null", { stdio: "ignore" }); return true; } catch {}
  if (process.env.SWARM_ALLOW_OLLAMA_INSTALL !== "1") return false;
  try {
    execSync("curl -fsSL https://ollama.com/install.sh | timeout 180 sh >/dev/null 2>&1; (ollama serve >/dev/null 2>&1 &); sleep 4; timeout 240 ollama pull qwen2.5:0.5b >/dev/null 2>&1", { stdio: "ignore", shell: "/bin/bash" });
    return true;
  } catch { return false; }
}

export async function chat(prompt, { system = "Output compact JSON only.", maxTokens = 150, json = true } = {}) {
  if (json) system = "Respond with JSON only. " + system; // Groq json_object mode requires the word "json" — keep it at the front so compress() never drops it
  const now = Date.now(), order = Q.cascade.filter(p => p !== "template");
  // groq first (14.4k req/day, fastest); rotate only among the fallbacks so a single rate-limited provider is not hammered every cycle
  const rest = order.filter(p => p !== "groq" && p !== "ollama_local"), rot = Q.rotation_offset % Math.max(1, rest.length);
  const tryOrder = ["groq", ...rest.slice(rot), ...rest.slice(0, rot), "ollama_local"].filter((v, i, a) => a.indexOf(v) === i);
  for (const name of tryOrder) {
    const p = PROV[name], st = Q.providers[name]; if (!p || !st) continue;
    if (st.cooldown_until > now) continue;
    const key = p.key(); if (!key) { console.error(`llm ${name}: no key`); continue; }
    if (p.local && !ensureOllama()) { st.fails++; st.cooldown_until = now + 6 * 3600e3; continue; }
    for (let attempt = 0; attempt < (name === "pollinations" ? 3 : 1); attempt++) {
    if (attempt) await new Promise(r => setTimeout(r, 47000)); // Pollinations anonymous: 1 reply / 45s per IP
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), p.local || name === "nvidia_nim" ? 120000 : 60000);
    try {
      const r = await fetch(p.url, { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: p.model, max_tokens: (name === "pollinations" || /gpt-oss|o[1-9]-|reason|think/i.test(p.model)) ? maxTokens + 1500 : maxTokens, temperature: 0.9, ...((name === "pollinations" || /gpt-oss/i.test(p.model)) ? { reasoning_effort: "low" } : {}), messages: [{ role: "system", content: compress(system, 1400) }, { role: "user", content: compress(prompt) }], ...(json && name !== "pollinations" && name !== "ollama_local" ? { response_format: { type: "json_object" } } : {}) }) });
      clearTimeout(t); st.calls++; if (!r.ok) console.error(`llm ${name} HTTP ${r.status}: ${(await r.clone().text()).slice(0,160).replace(/\s+/g," ")}`);
      if (name === "pollinations" && (r.status === 402 || r.status === 429)) { st.fails++; continue; } // per-IP pacing, retry after wait
      if (r.status === 429 || r.status === 402 || r.status === 403) { st.fails++; st.last_error = `${r.status}`; st.cooldown_until = now + (r.status === 429 ? 3600e3 : 24 * 3600e3); break; }
      if (!r.ok) { st.fails++; st.last_error = `${r.status} ${(await r.text().catch(()=>"")).slice(0,160)}`; console.error(`llm ${name}: ${st.last_error}`); if (r.status >= 500) st.cooldown_until = now + 900e3; break; }
      let j; try { j = await r.json(); } catch { console.error(`llm ${name}: non-JSON 200 body (GitHub Models likely not enabled for repo)`); st.fails++; st.cooldown_until = now + 6 * 3600e3; break; }
      const txt = j.choices?.[0]?.message?.content ?? ""; if (!txt) { st.fails++; break; }
      return { provider: name, text: txt };
    } catch (e) { clearTimeout(t); st.fails++; st.cooldown_until = now + 900e3; st.last_error = `${e.message} ${e.cause?.message||""}`.trim(); console.error(`llm ${name} error: ${st.last_error}`); break; }
    }
  }
  Q.providers.template.calls++;
  return { provider: "template", text: null }; // caller must have a deterministic fallback
}
export function parseJSON(txt) { try { return JSON.parse(txt); } catch {} const m = String(txt || "").match(/\{[\s\S]*\}|\[[\s\S]*\]/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } }

// Operating core (swarm/CORE.md): opt-in compressed excerpt for prompts that make judgement calls (creative, closer, partner drafts). Not auto-injected — minimum usage.
export function coreHint(max = 700) { try { return compress(fs.readFileSync("swarm/CORE.md", "utf8").replace(/^#+ .*$/gm, "").replace(/`/g, "").replace(/^- /gm, ""), max); } catch { return ""; } }

// Vendored agent skills (skills/<name>/SKILL.md): pull a compressed excerpt of the instruction body into a prompt. Zero-cost, offline.
export function skillHint(name, max = 900) {
  try { const t = fs.readFileSync(`skills/${name}/SKILL.md`, "utf8").replace(/^---[\s\S]*?---\s*/, "").replace(/```[\s\S]*?```/g, "").replace(/^#+ .*$/gm, "").replace(/\*\*/g, "");
    return compress(t, max); } catch { return ""; }
}
