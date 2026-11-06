#!/usr/bin/env python3
"""Retention-first renderer (v2). Called by make-video.py after it picked the script.
Inputs: speech text, hook, cta line, out path. Output: 1080x1920 mp4 + returns duration.
Design (from Buffer metrics: avg watch 3.7–5.3s on v1 → fix the first 3 seconds):
  - animated gradient background (never a static black frame)
  - 0.0–1.6s: giant hook card (pattern interrupt), progress bar from frame 1
  - word-by-word captions synced to edge-tts word boundaries (karaoke pop-in)
  - persistent URL + last 2s: URL card + "follow for day N"
"""
import asyncio, json, os, subprocess, sys, textwrap

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
PALETTES = [("0x0f172a", "0x312e81"), ("0x1a1a1a", "0x7c2d12"), ("0x042f2e", "0x0f172a"), ("0x3b0764", "0x0c0a09"), ("0x111827", "0x065f46")]

def esc(t):  # ffmpeg drawtext escaping
    return t.replace("\\", "\\\\").replace("'", "\u2019").replace(":", "\\:").replace("%", "\\%").replace(",", "\\,")

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

def render(hook, speech, url, day, out, seed=0):
    os.makedirs("/tmp/vid", exist_ok=True); mp3 = "/tmp/vid/voice.mp3"
    try:
        words = asyncio.run(tts(speech, mp3))
    except Exception as e:
        print("edge-tts failed:", e); words = []
        subprocess.run(["espeak-ng", "-s", "150", "-w", "/tmp/vid/voice.wav", speech], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "/tmp/vid/voice.wav", mp3], check=True)
    adur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).decode())
    HOOK_T = 1.6; dur = HOOK_T + adur + 2.0
    c0, c1 = PALETTES[seed % len(PALETTES)]
    f = []
    # progress bar (top) — tells the brain "this is short"
    f.append(f"drawbox=x=0:y=0:w=iw*t/{dur:.2f}:h=14:color=0xf2c94c@0.9:t=fill")
    # hook card
    hl = textwrap.wrap(hook, 16); size = 96 if len(hl) <= 3 else 80; lh = int(size * 1.2); tot = lh * len(hl)
    for j, ln in enumerate(hl):
        p = f"/tmp/vid/h{j}.txt"; open(p, "w").write(ln)
        f.append(f"drawtext=fontfile={FONT}:textfile={p}:fontcolor=white:fontsize={size}:borderw=6:bordercolor=black@0.6:x=(w-text_w)/2:y=(h-{tot})/2+{j*lh}:enable='lt(t,{HOOK_T})'")
    # karaoke captions: lines of <=3 words, words pop in as spoken
    if words:
        lines, cur = [], []
        for w in words:  # char budget per line so nothing overflows 1080px
            if cur and (len(" ".join(x[2] for x in cur)) + len(w[2]) + 1 > 14 or len(cur) == 3): lines.append(cur); cur = []
            cur.append(w)
        if cur: lines.append(cur)
        for li, ln in enumerate(lines):
            l_end = lines[li + 1][0][0] if li + 1 < len(lines) else adur + 0.4
            for k in range(len(ln)):
                txt = " ".join(w[2] for w in ln[:k + 1]).upper()
                p = f"/tmp/vid/w{li}_{k}.txt"; open(p, "w").write(txt)
                st = ln[k][0] + HOOK_T; en = (ln[k + 1][0] if k + 1 < len(ln) else l_end) + HOOK_T
                fs = 84 if len(txt) <= 12 else (70 if len(txt) <= 15 else 58)
                f.append(f"drawtext=fontfile={FONT}:textfile={p}:fontcolor=white:fontsize={fs}:borderw=8:bordercolor=black@0.75:x=(w-text_w)/2:y=h/2-40:enable='between(t,{st:.2f},{en:.2f})'")
    else:  # fallback: sentence cards
        sents = [x for x in speech.replace("...", ".").split(". ") if x.strip()]; seg = adur / max(1, len(sents))
        for i, s_ in enumerate(sents):
            wl = textwrap.wrap(s_, 22); lh = 78; tot = lh * len(wl)
            for j, ln in enumerate(wl):
                p = f"/tmp/vid/s{i}_{j}.txt"; open(p, "w").write(ln)
                f.append(f"drawtext=fontfile={FONT}:textfile={p}:fontcolor=white:fontsize=64:borderw=6:bordercolor=black@0.7:x=(w-text_w)/2:y=(h-{tot})/2+{j*lh}:enable='between(t,{HOOK_T+i*seg:.2f},{HOOK_T+(i+1)*seg:.2f})'")
    # persistent brand + URL, end card
    f.append(f"drawtext=fontfile={FONT}:text='RECEIPTS  ·  DAY {day}':fontcolor=0xcccccc:fontsize=34:x=(w-text_w)/2:y=h-230:enable='lt(t,{dur-2:.2f})'")
    f.append(f"drawtext=fontfile={FONT}:text='{esc(url)}':fontcolor=0xf2c94c:fontsize=42:borderw=4:bordercolor=black@0.6:x=(w-text_w)/2:y=h-170:enable='lt(t,{dur-2:.2f})'")
    f.append(f"drawtext=fontfile={FONT}:text='Free Step 1 template':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=h/2-160:enable='gte(t,{dur-2:.2f})'")
    f.append(f"drawtext=fontfile={FONT}:text='{esc(url)}':fontcolor=0xf2c94c:fontsize=56:x=(w-text_w)/2:y=h/2-40:enable='gte(t,{dur-2:.2f})'")
    f.append(f"drawtext=fontfile={FONT}:text='Follow for day {day+1}':fontcolor=0xcccccc:fontsize=48:x=(w-text_w)/2:y=h/2+80:enable='gte(t,{dur-2:.2f})'")
    f.append("vignette=PI/4")
    vf = ",".join(f)
    cmd = ["ffmpeg", "-y", "-loglevel", "error",
           "-f", "lavfi", "-i", f"gradients=s=1080x1920:c0={c0}:c1={c1}:x0=0:y0=0:x1=1080:y1=1920:speed=0.08:d={dur:.2f}:r=30",
           "-f", "lavfi", "-t", f"{HOOK_T:.2f}", "-i", "anullsrc=r=24000:cl=mono",
           "-i", mp3, "-filter_complex", f"[0:v]{vf}[v];[1:a][2:a]concat=n=2:v=0:a=1,apad=pad_dur=2[a]",
           "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-t", f"{dur:.2f}", out]
    subprocess.run(cmd, check=True)
    return dur

if __name__ == "__main__":
    d = render(sys.argv[1], sys.argv[2], "receipts-blond.vercel.app/free", int(sys.argv[3]), sys.argv[4], int(sys.argv[3]))
    print("ok", sys.argv[4], round(d, 1))
