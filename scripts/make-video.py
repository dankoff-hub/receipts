#!/usr/bin/env python3
"""Generate a 1080x1920 TikTok video from a script: voiceover (edge-tts, free) + animated text cards (ffmpeg)."""
import asyncio, json, re, subprocess, sys, textwrap, os, shutil
day = int(sys.argv[1]); out = sys.argv[2]
import os as _os
md = open("content/launch-scripts.md").read()
if _os.path.exists("content/forge-scripts.md"):
    md += "\n" + open("content/forge-scripts.md").read()
S = [dict(n=int(m[0]), hook=m[1], say=m[2], body=m[3], cta=m[4]) for m in re.findall(r"## (\d+)\. (.+)\n- Hook[^\n]*\n- Say: (.+)\n- Body: (.+)\n- CTA: (.+)", md)]
# no-repeat guarantee: pick the first script not yet used (content/script-ledger.json)
import hashlib as _hl
_led_p = "content/script-ledger.json"
try: _led = json.load(open(_led_p))
except Exception: _led = {"used": []}
def _sh(x): return _hl.md5((x["hook"] + "|" + x["say"]).encode()).hexdigest()
s = None
for _i in range(len(S)):
    _c = S[(day + _i) % len(S)]
    if _sh(_c) not in _led["used"]: s = _c; break
if s is None:
    s = S[day % len(S)]  # pool exhausted — fall back to rotation (forge adds 10/week)
else:
    _led["used"].append(_sh(s)); json.dump(_led, open(_led_p, "w"))
sent = [x.strip() for x in re.split(r"(?<=[.?!])\s+", s["say"]) if x.strip()]
cards = [s["hook"]] + sent + ["$29 · link in bio"]
speech = f"{s['hook']} ... {s['say']} ... {s['cta']}"
os.makedirs("/tmp/vid", exist_ok=True)
async def tts():
    import edge_tts
    try:
        await edge_tts.Communicate(speech, "en-US-BrianMultilingualNeural", rate="+10%", pitch="-5Hz").save("/tmp/vid/voice.mp3"); return True
    except Exception as e:
        print("edge-tts failed:", e); return False
ok = asyncio.run(tts())
if not ok:
    subprocess.run(["espeak-ng","-s","150","-w","/tmp/vid/voice.wav",speech],check=True)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i","/tmp/vid/voice.wav","/tmp/vid/voice.mp3"],check=True)
dur = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0","/tmp/vid/voice.mp3"]).decode()) + 1.2
font = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
def esc(t): return t.replace("\\","\\\\").replace("'","\u2019").replace(":","\\:").replace("%","\\%")
seg = dur / len(cards); filt = []
for i, c in enumerate(cards):
    lines = textwrap.wrap(c, 24); size = 72 if i == 0 else 60; lh = int(size*1.35)
    total = lh*len(lines)
    for j, ln in enumerate(lines):
        tf=f"/tmp/vid/c{i}_{j}.txt"; open(tf,"w").write(ln)
        y = f"(h-{total})/2+{j*lh}"
        filt.append(f"drawtext=fontfile={font}:textfile={tf}:fontcolor=white:fontsize={size}:x=(w-text_w)/2:y={y}:enable='between(t,{i*seg:.2f},{(i+1)*seg:.2f})'")
filt.append(f"drawtext=fontfile={font}:text='RECEIPTS':fontcolor=0x888888:fontsize=34:x=(w-text_w)/2:y=h-200")
# persistent on-screen URL: viewers cannot click captions on TikTok/IG, a readable URL is the CTR lever
filt.append(f"drawtext=fontfile={font}:text='receipts-blond.vercel.app/free':fontcolor=0xf2c94c:fontsize=40:x=(w-text_w)/2:y=h-140")
vf = ",".join(filt)
subprocess.run(["ffmpeg","-y","-loglevel","error","-f","lavfi","-i",f"color=c=0x0b0b0c:s=1080x1920:d={dur:.2f}:r=30",
  "-i","/tmp/vid/voice.mp3","-vf",vf,"-c:v","libx264","-pix_fmt","yuv420p","-c:a","aac","-b:a","128k","-shortest",out],check=True)
_tags = ["provethemwrong","receipts","30daychallenge","fyp","careertok","motivation","selfimprovement"]
try:
    _tj = json.load(open("content/tags.json"))
    if _tj.get("mixes"): _tags = _tj["mixes"][day % len(_tj["mixes"])]["tiktok"]
    elif _tj.get("fallback"): _tags = _tj["fallback"]["tiktok"]
except Exception: pass
_tagstr = " ".join("#"+t for t in _tags)
_cta_line = "the 30-day Receipts system, link in bio."
try:
    _cb = json.load(open("content/cta-bank.json"))
    if _cb.get("lines"): _cta_line = _cb["lines"][day % len(_cb["lines"])]
except Exception: pass
json.dump(dict(day=(int(sys.argv[3]) if len(sys.argv)>3 else day+1), n=s["n"], hook=s["hook"], caption=f"{s['hook']} — {_cta_line}\n" + _tagstr, duration=dur), open(out+".json","w"))
print("ok", out, round(dur,1), "s")
