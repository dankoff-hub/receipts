#!/usr/bin/env node
// Image Forge — every other UTC day the Instagram photo slot uses a freshly generated high-res image instead of a founder photo.
// Generation runs on Cloudflare Workers AI (free tier, no card) via the swarm worker's key-gated POST /image endpoint.
// Output: public/photos/ai-YYYYMMDD-<slug>.jpg (1080x1350 or 1080x1080, Lanczos-upscaled from the model output),
//         an entry in content/ai-photo-queue.json and a unique caption in content/photo-captions.json.
// Never repeats a prompt or a caption (hash ledger). On any failure it exits 0 so post-photo.mjs falls back to the founder photo queue.
import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
const WORKER = process.env.SWARM_WORKER_URL, KEY = process.env.SWARM_KEY, SITE = process.env.APP_URL || "https://receipts-blond.vercel.app";
const load = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };
const save = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 1));
const today = new Date(), day = today.toISOString().slice(0, 10), ymd = day.replace(/-/g, "");
const doy = Math.floor((today - new Date(Date.UTC(today.getUTCFullYear(), 0, 0))) / 864e5);
export const isAiDay = doy % 2 === 0; // even day-of-year → generated image, odd → founder photo
if (process.argv[2] !== "--force" && !isAiDay) { console.log("founder-photo day — no AI image"); process.exit(0); }
if (!WORKER || !KEY) { console.log("SWARM_WORKER_URL / SWARM_KEY missing — skip"); process.exit(0); }
const aiq = load("content/ai-photo-queue.json", { note: "Generated images (Workers AI, free). One per even UTC day-of-year.", queue: [] });
if (aiq.queue.some(q => q.day === day)) { console.log("AI image already made today"); process.exit(0); }

// Scene bank: no faces, no text in image (models garble text). Rotates; never reuses a scene while unused ones remain.
const scenes = [
  ["receipt-notebook", "a worn pocket notebook open on a wooden desk, a single handwritten line and a date, a paper receipt tucked in as a bookmark, soft morning window light"],
  ["gym-floor", "empty gym at 6am, one dumbbell on the rubber floor, towel and water bottle on a bench, long shadows from tall windows"],
  ["rainy-window", "rain streaking a bus window at dawn, blurred city lights, a phone with a notes app glowing in a hand, moody cinematic"],
  ["kitchen-calculator", "kitchen table at night, a calculator, a stack of paper bills, a mug of tea, one lamp, documentary photo"],
  ["coffee-receipt", "a paper receipt and a takeaway coffee cup on a cafe counter, card reader in soft focus, warm light"],
  ["desk-30-days", "a wall calendar with thirty days crossed off in pen, a pencil on a clean desk, minimal, high detail"],
  ["running-shoes", "running shoes on a wet pavement at sunrise, autumn leaves, empty street, cinematic"],
  ["laptop-log", "a laptop on a shared office desk showing a plain text log, a cold coffee beside it, early evening light"],
  ["barber-chair", "an empty vintage barber chair facing a mirror, clippers on the counter, warm tungsten light"],
  ["groceries-receipt", "a long supermarket receipt curling on a kitchen counter next to paper bags, overhead shot"],
  ["notebook-rain", "a notebook under a jacket in the rain, pen clipped to the page, close-up, water droplets"],
  ["stairwell", "a concrete stairwell lit by one window, a single pair of shoes mid-step, motion blur, high contrast"],
];
const usedScenes = new Set(aiq.queue.map(q => q.scene));
const [scene, desc] = scenes.find(([s]) => !usedScenes.has(s)) || scenes[aiq.queue.length % scenes.length];
const styles = ["shot on 35mm film, natural grain", "iphone candid, slightly imperfect framing", "editorial photograph, shallow depth of field", "documentary realism, muted colours"];
const prompt = `${desc}, ${styles[aiq.queue.length % styles.length]}, photorealistic, no people, no text, no watermark, 4k detail`;

const callImage = async (model) => {
  const r = await fetch(`${WORKER}/image`, { method: "POST", headers: { "content-type": "application/json", "x-swarm-key": KEY }, body: JSON.stringify({ prompt, model, width: 1024, height: 1280, daily_cap: 6 }) });
  if (!r.ok) throw new Error(`${model} ${r.status} ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
};
let img, model = "flux";
try { img = await callImage("flux"); } catch (e) { console.log("flux failed:", e.message); try { img = await callImage("sdxl"); model = "sdxl"; } catch (e2) { console.log("sdxl failed:", e2.message); process.exit(0); } }
const raw = `/tmp/ai-${ymd}.png`; fs.writeFileSync(raw, img);
const out = `ai-${ymd}-${scene}.jpg`;
// Upscale to Instagram-native size (1080x1350 portrait for 4:5 sources, else 1080x1080) with Lanczos + light sharpening.
execSync(`python3 - <<'PY'
from PIL import Image, ImageFilter
im=Image.open("${raw}").convert("RGB"); w,h=im.size
tw,th=(1080,1350) if h>w*1.1 else (1080,1080)
if abs(w/h-tw/th)>0.01:
    s=max(tw/w,th/h); im=im.resize((round(w*s),round(h*s)),Image.LANCZOS); l=(im.width-tw)//2; t=(im.height-th)//2; im=im.crop((l,t,l+tw,t+th))
else: im=im.resize((tw,th),Image.LANCZOS)
im=im.filter(ImageFilter.UnsharpMask(radius=1.2,percent=60,threshold=3)); im.save("public/photos/${out}",quality=93,optimize=True)
print(im.size)
PY`, { stdio: "inherit" });

// Caption: LLM cascade (Groq → NVIDIA → Pollinations → template), unique by hash. Voice: Dan Rossi, "receipts" = written proof vs. doubters.
const caps = load("content/photo-captions.json", { captions: {} });
const ledger = load("content/caption-ledger.json", {});
let caption = null;
try {
  const { chat } = await import("../swarm/llm.mjs");
  const prev = Object.values(caps.captions).slice(-6).map(c => c.split("\n")[0]).join(" | ");
  const r = await chat(`Write an Instagram caption (70-110 words, 4 short paragraphs, then 5 hashtags including #receipts) for a photo of: ${desc}. Voice: first person, calm, a man proving doubters wrong by logging one line of proof a day for 30 days ("receipts"). Mention "Free Step 1 template, link in bio." once. No emojis. Must not reuse these openers: ${prev}. Return JSON {"caption": "..."}.`, { system: "You write terse, honest Instagram captions. JSON only.", maxTokens: 320 });
  caption = r?.caption && String(r.caption).trim();
} catch (e) { console.log("caption llm failed:", e.message); }
if (!caption) caption = `${desc.split(",")[0].replace(/^a |^an /, "").replace(/^\w/, c => c.toUpperCase())}. No face in this one, on purpose.\n\nThe receipt isn't the photo. It's the line I wrote before taking it: what they said, what I did about it, today's date.\n\nDay ${aiq.queue.length + 11} of showing up without an audience.\n\nFree Step 1 template, link in bio.\n\n#receipts #consistency #30daychallenge #provethemwrong #dailyhabits`;
const hash = crypto.createHash("md5").update(caption).digest("hex");
if (JSON.stringify(ledger).includes(hash) || Object.values(caps.captions).some(c => c === caption)) { console.log("caption collides — skip AI image today"); fs.unlinkSync(`public/photos/${out}`); process.exit(0); }
const slug = `ai-${ymd}-${scene}`;
caps.captions[slug] = caption; save("content/photo-captions.json", caps);
aiq.queue.push({ day, file: out, slug, scene, model, prompt, url: `${SITE}/photos/${out}` }); save("content/ai-photo-queue.json", aiq);
console.log("AI image ready:", out, "model:", model);
