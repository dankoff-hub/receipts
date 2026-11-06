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
# v2 renderer (retention-first: animated bg, hook card, karaoke captions, URL end card) — see scripts/render-v2.py
sys.path.insert(0, "scripts"); from importlib import import_module
_r = import_module("render-v2".replace("-", "_")) if False else None
import importlib.util as _ilu
_spec = _ilu.spec_from_file_location("render_v2", "scripts/render-v2.py"); _rv = _ilu.module_from_spec(_spec); _spec.loader.exec_module(_rv)
_label = int(sys.argv[3]) if len(sys.argv) > 3 else day + 1
_cta_spoken = re.sub(r"\$?29[^.]*link in bio\.?", "Free step one template, link on screen.", s["cta"]).replace("link in bio", "link on screen")
speech = f"{s['hook']} {s['say']} {_cta_spoken}"
dur = _rv.render(s["hook"], speech, "receipts-blond.vercel.app/free", _label, out, seed=day)
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
