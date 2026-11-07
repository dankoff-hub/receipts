#!/usr/bin/env python3
"""Retention-first renderer (v3 = v2 + tracked variants). Called by make-video.py after it picked the script.
Inputs: speech text, hook, url, day label, out path, seed, variant. Output: 1080x1920 mp4; returns (duration, meta).
Design (Buffer metrics: avg watch 3.7–5.3s on v1 → fix the first 3 seconds):
  - background = animated gradient OR free b-roll footage (city / nature / other; Mixkit License, content/broll-pool.json)
  - 0.0–1.0s: giant hook card (pattern interrupt), progress bar from frame 1, voice starts at 1.0s (speech inside first 3s)
  - word-by-word captions synced to edge-tts word boundaries (karaoke pop-in); sentence cards when voice is off
  - optional music bed (content/music-pool.json): -16 dB under voice, -7 dB when voice is off, 1.5s fade-out
  - persistent URL + last 2s: URL card + "follow for day N"
Variant = {"voice": "on"|"off", "music": "on"|"off", "bg": "gradient"|"city"|"nature"|"other"} — chosen by make-video.py from
content/variant-policy.json (weights updated by scripts/post-metrics.mjs from real per-post metrics) and written to <out>.json.
"""
import asyncio, json, os, random, subprocess, sys, textwrap, urllib.request

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
PALETTES = [("0x0f172a", "0x312e81"), ("0x1a1a1a", "0x7c2d12"), ("0x042f2e", "0x0f172a"), ("0x3b0764", "0x0c0a09"), ("0x111827", "0x065f46")]
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
HOOK_T = 1.0  # default; render() sets it from hook length (1.4–2.4s)

def esc(t):  # ffmpeg drawtext escaping
    return t.replace("\\", "\\\\").replace("'", "\u2019").replace(":", "\\:").replace("%", "\\%").replace(",", "\\,")

def _load(p, d):
    try: return json.load(open(p))
    except Exception: return d

def _fetch(url, dst, limit_mb=120):
    if os.path.exists(dst) and os.path.getsize(dst) > 50_000: return dst
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r, open(dst, "wb") as f:
        n = 0
        while True:
            b = r.read(1 << 20)
            if not b: break
            f.write(b); n += len(b)
            if n > limit_mb << 20: raise RuntimeError("too big")
    return dst

def pick_broll(theme, rng):
    pool = _load("content/broll-pool.json", {}).get("clips", [])
    c = [x for x in pool if x.get("theme") == theme]
    if not c: return None
    v = [x for x in c if x.get("vertical")] or c
    x = rng.choice(v)
    for url in [x.get("url1080"), x.get("url720")]:
        if not url: continue
        try: return dict(x, file=_fetch(url, f"/tmp/vid/broll-{x['id']}-{'1080' if url == x.get('url1080') else '720'}.mp4"))
        except Exception as e: print("broll fetch failed:", url, e)
    return None

def pick_music(rng):
    tr = _load("content/music-pool.json", {}).get("tracks", [])
    if not tr: return None
    x = rng.choice(tr)
    try: return dict(x, file=_fetch(x["url"], f"/tmp/vid/music-{x['id']}.mp3", 30))
    except Exception as e: print("music fetch failed:", e); return None

async def tts(text, mp3):
    import edge_tts
    words = []
    try: c = edge_tts.Communicate(text, "en-US-BrianMultilingualNeural", rate="+10%", pitch="-5Hz", boundary="WordBoundary")
    except TypeError: c = edge_tts.Communicate(text, "en-US-BrianMultilingualNeural", rate="+10%", pitch="-5Hz")
    with open(mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary": words.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
    return words

def render(hook, speech, url, day, out, seed=0, variant=None):
    variant = dict({"voice": "on", "music": "off", "bg": "gradient"}, **(variant or {}))
    HOOK_T = min(2.4, max(1.4, 0.26 * len(hook.split()) + 0.5))  # time to read the hook card at ~4 words/s
    MIN_SHOW = 1.1  # a caption phrase never stays on screen less than this
    rng = random.Random(seed * 7919 + 17)
    os.makedirs("/tmp/vid", exist_ok=True); mp3 = "/tmp/vid/voice.mp3"
    words = []; meta = {"variant": variant, "broll": None, "music": None}
    # ---- voice
    if variant["voice"] == "on":
        try:
            words = asyncio.run(tts(speech, mp3))
        except Exception as e:
            print("edge-tts failed:", e); words = []
            subprocess.run(["espeak-ng", "-s", "150", "-w", "/tmp/vid/voice.wav", speech], check=True)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "/tmp/vid/voice.wav", mp3], check=True)
        adur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).decode())
    else:
        variant["music"] = "on"  # never a silent video
        adur = max(9.0, min(26.0, len(speech.split()) / 2.0))  # reading pace ≈ 2.0 words/s (comfortable)
    dur = HOOK_T + adur + 2.0
    # ---- music
    music = pick_music(rng) if variant["music"] == "on" else None
    if music: meta["music"] = {"id": music["id"], "mood": music.get("mood"), "title": music.get("title")}
    else: variant["music"] = "off"
    # ---- background
    broll = pick_broll(variant["bg"], rng) if variant["bg"] != "gradient" else None
    if broll: meta["broll"] = {"id": broll["id"], "theme": broll["theme"], "title": broll.get("title"), "vertical": broll.get("vertical")}
    else: variant["bg"] = "gradient"
    c0, c1 = PALETTES[seed % len(PALETTES)]
    f = []
    if broll:  # cover-scale, center-crop to 9:16, slow push-in, darken for text legibility
        f.append("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30")
        f.append(f"zoompan=z='min(1+0.00035*on,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30")
        f.append("eq=saturation=1.08,drawbox=x=0:y=0:w=iw:h=ih:color=black@0.22:t=fill")
    # progress bar (top) — tells the brain "this is short"
    f.append(f"drawbox=x=0:y=0:w=iw*t/{dur:.2f}:h=14:color=0xf2c94c@0.9:t=fill")
    # hook card
    hl = textwrap.wrap(hook, 16); size = 96 if len(hl) <= 3 else 80; lh = int(size * 1.2); tot = lh * len(hl)
    for j, ln in enumerate(hl):
        p = f"/tmp/vid/h{j}.txt"; open(p, "w").write(ln)
        f.append(f"drawtext=fontfile={FONT}:textfile={p}:fontcolor=white:fontsize={size}:borderw=6:bordercolor=black@0.6:x=(w-text_w)/2:y=(h-{tot})/2+{j*lh}:enable='lt(t,{HOOK_T})'")
    # phrase captions: 3–5 spoken words per card, shown whole (no per-word flicker), minimum hold time, synced to speech
    if words:
        # align TTS word boundaries with the script tokens to find clause/sentence ends (punctuation)
        toks = speech.split(); k = 0; ends = []
        for w in words:
            kk = k; hit = False
            while kk < min(len(toks), k + 4):
                if toks[kk].strip(".,!?;:\"'()").lower() == w[2].strip(".,!?;:\"'()").lower(): hit = True; break
                kk += 1
            if hit: ends.append(toks[kk].rstrip("\"')")[-1:] in ".,!?;:"); k = kk + 1
            else: ends.append(False)
        # clauses = runs of words ending at punctuation; each clause is split into balanced chunks of <=5 words / <=24 chars
        import math
        clauses, cur = [], []
        for w, e in zip(words, ends):
            cur.append(w)
            if e: clauses.append(cur); cur = []
        if cur: clauses.append(cur)
        phrases = []  # (words, is_clause_end)
        for cl in clauses:
            chars = len(" ".join(x[2] for x in cl)); n = max(1, math.ceil(len(cl) / 5), math.ceil(chars / 24))
            size = math.ceil(len(cl) / n)
            chunks = [cl[a:a + size] for a in range(0, len(cl), size)]
            for ci, ch in enumerate(chunks): phrases.append((ch, ci == len(chunks) - 1))
        # merge a phrase that would flash by (< MIN_SHOW) into the previous one, never across a clause end
        merged = []
        for ph, e in phrases:
            if merged and not merged[-1][1] and (ph[0][0] - merged[-1][0][0][0]) < MIN_SHOW and len(" ".join(x[2] for x in merged[-1][0] + ph)) <= 36: merged[-1] = (merged[-1][0] + ph, e)
            else: merged.append((ph, e))
        merged = [m[0] for m in merged]
        # timing: natural start = first spoken word; hold at least MIN_SHOW; never overlap (next card waits)
        times = []; prev_end = HOOK_T
        for li, ph in enumerate(merged):
            st = max(ph[0][0] + HOOK_T, prev_end)
            nat_en = (merged[li + 1][0][0] + HOOK_T) if li + 1 < len(merged) else adur + HOOK_T + 0.6
            en = min(max(nat_en, st + MIN_SHOW), dur - 2.0); st = min(st, en - 0.3); times.append((st, en)); prev_end = en  # never run into the end card
        for li, ph in enumerate(merged):
            st, en = times[li]
            txt = " ".join(w[2] for w in ph)
            wl = textwrap.wrap(txt, 16) if len(txt) > 16 else [txt]
            fs = 80 if len(txt) <= 12 else 68; lh = int(fs * 1.25); tot = lh * len(wl)
            for j, ln in enumerate(wl):
                p = f"/tmp/vid/w{li}_{j}.txt"; open(p, "w").write(ln.upper())
                f.append(f"drawtext=fontfile={FONT}:textfile={p}:fontcolor=white:fontsize={fs}:borderw=8:bordercolor=black@0.75:x=(w-text_w)/2:y=h/2-{tot//2}+{j*lh}:enable='between(t,{st:.2f},{en:.2f})'")
    else:  # sentence cards (voice off, or TTS without word boundaries)
        sents = [x for x in speech.replace("...", ".").split(". ") if x.strip()]
        if len(sents) > 1 and sents[0].strip(" .?!").lower() == hook.strip(" .?!").lower(): sents = sents[1:]  # hook card already showed it
        wc = [max(3, len(s_.split())) for s_ in sents]; tw = sum(wc)
        t0 = HOOK_T
        for i, s_ in enumerate(sents):
            seg = max(1.8, adur * wc[i] / tw)
            wl = textwrap.wrap(s_, 22); lh = 78; tot = lh * len(wl)
            for j, ln in enumerate(wl):
                p = f"/tmp/vid/s{i}_{j}.txt"; open(p, "w").write(ln)
                f.append(f"drawtext=fontfile={FONT}:textfile={p}:fontcolor=white:fontsize=64:borderw=6:bordercolor=black@0.7:x=(w-text_w)/2:y=(h-{tot})/2+{j*lh}:enable='between(t,{t0:.2f},{t0+seg:.2f})'")
            t0 += seg
    # persistent brand + URL, end card
    f.append(f"drawtext=fontfile={FONT}:text='RECEIPTS  ·  DAY {day}':fontcolor=0xcccccc:fontsize=34:x=(w-text_w)/2:y=h-230:enable='lt(t,{dur-2:.2f})'")
    f.append(f"drawtext=fontfile={FONT}:text='{esc(url)}':fontcolor=0xf2c94c:fontsize=42:borderw=4:bordercolor=black@0.6:x=(w-text_w)/2:y=h-170:enable='lt(t,{dur-2:.2f})'")
    if variant.get("cta") == "follow":  # follow-first end card
        f.append(f"drawtext=fontfile={FONT}:text='FOLLOW':fontcolor=0xf2c94c:fontsize=120:borderw=6:bordercolor=black@0.5:x=(w-text_w)/2:y=h/2-200:enable='gte(t,{dur-2:.2f})'")
        f.append(f"drawtext=fontfile={FONT}:text='for day {day+1} tomorrow':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=h/2-40:enable='gte(t,{dur-2:.2f})'")
        f.append(f"drawtext=fontfile={FONT}:text='Free Step 1 template \\: link in my profile':fontcolor=0xcccccc:fontsize=38:x=(w-text_w)/2:y=h/2+90:enable='gte(t,{dur-2:.2f})'")
        f.append(f"drawtext=fontfile={FONT}:text='or type {esc(url)}':fontcolor=0x999999:fontsize=32:x=(w-text_w)/2:y=h/2+145:enable='gte(t,{dur-2:.2f})'")
    else:
        f.append(f"drawtext=fontfile={FONT}:text='Free Step 1 template':fontcolor=white:fontsize=68:x=(w-text_w)/2:y=h/2-200:enable='gte(t,{dur-2:.2f})'")
        f.append(f"drawtext=fontfile={FONT}:text='LINK IN MY PROFILE':fontcolor=0xf2c94c:fontsize=76:borderw=6:bordercolor=black@0.5:x=(w-text_w)/2:y=h/2-90:enable='gte(t,{dur-2:.2f})'")
        f.append(f"drawtext=fontfile={FONT}:text='or type {esc(url)}':fontcolor=0x999999:fontsize=32:x=(w-text_w)/2:y=h/2+30:enable='gte(t,{dur-2:.2f})'")
        f.append(f"drawtext=fontfile={FONT}:text='Follow for day {day+1}':fontcolor=0xcccccc:fontsize=48:x=(w-text_w)/2:y=h/2+120:enable='gte(t,{dur-2:.2f})'")
    f.append("vignette=PI/4")
    vf = ",".join(f)
    # ---- inputs: 0 = background, then audio inputs
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    if broll: cmd += ["-stream_loop", "-1", "-i", broll["file"]]
    else: cmd += ["-f", "lavfi", "-i", f"gradients=s=1080x1920:c0={c0}:c1={c1}:x0=0:y0=0:x1=1080:y1=1920:speed=0.08:d={dur:.2f}:r=30"]
    fc = [f"[0:v]{vf}[v]"]; ai = 1; mixes = []
    if variant["voice"] == "on":
        cmd += ["-f", "lavfi", "-t", f"{HOOK_T:.2f}", "-i", "anullsrc=r=24000:cl=mono", "-i", mp3]
        fc.append(f"[{ai}:a][{ai+1}:a]concat=n=2:v=0:a=1,apad=pad_dur=2,aformat=sample_rates=44100:channel_layouts=stereo[va]"); mixes.append("[va]"); ai += 2
    if music:
        gain = -16 if variant["voice"] == "on" else -7
        cmd += ["-stream_loop", "-1", "-i", music["file"]]
        fc.append(f"[{ai}:a]atrim=0:{dur:.2f},volume={gain}dB,afade=t=in:st=0:d=0.8,afade=t=out:st={dur-1.5:.2f}:d=1.5,aformat=sample_rates=44100:channel_layouts=stereo[ma]"); mixes.append("[ma]"); ai += 1
    if len(mixes) == 2: fc.append(f"{mixes[0]}{mixes[1]}amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]")
    else: fc.append(f"{mixes[0]}acopy[a]")
    cmd += ["-filter_complex", ";".join(fc), "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k", "-t", f"{dur:.2f}", "-shortest", out]
    subprocess.run(cmd, check=True)
    meta["variant"] = variant
    return dur, meta

if __name__ == "__main__":
    v = json.loads(sys.argv[5]) if len(sys.argv) > 5 else None
    d, m = render(sys.argv[1], sys.argv[2], "receiptspack.vercel.app/free", int(sys.argv[3]), sys.argv[4], int(sys.argv[3]), v)
    print("ok", sys.argv[4], round(d, 1), json.dumps(m))
