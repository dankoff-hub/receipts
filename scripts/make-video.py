#!/usr/bin/env python3
"""Generate a 1080x1920 TikTok video from a script: voiceover (edge-tts, free) + animated text cards (ffmpeg)."""
import asyncio, json, re, subprocess, sys, textwrap, os, shutil
day = int(sys.argv[1]); out = sys.argv[2]
import os as _os
md = open("content/launch-scripts.md").read()
if _os.path.exists("content/forge-scripts.md"):
    md += "\n" + open("content/forge-scripts.md").read()
def _clean_hook(h): return re.sub(r"\s*\[[^\]]*\]\s*$", "", h).strip()  # drop "[platform/format]" tags from creative headers
S = [dict(n=int(m[0]), hook=_clean_hook(m[1]), say=m[2], body=m[3], cta=m[4]) for m in re.findall(r"## (\d+)\. (.+)\n- Hook[^\n]*\n- Say: (.+)\n- Body: (.+)\n- CTA: (.+)", md)]
# no-repeat guarantee: pick the first script not yet used (content/script-ledger.json)
import hashlib as _hl
_led_p = "content/script-ledger.json"
try: _led = json.load(open(_led_p))
except Exception: _led = {"used": []}
def _sh(x): return _hl.md5((x["hook"] + "|" + x["say"]).encode()).hexdigest()
s = None
# Revenue-swarm priority: unused scripts in content/swarm-scripts.md (written by swarm/creative.mjs) publish first.
if _os.path.exists("content/swarm-scripts.md"):
    _SW = [dict(n=int(m[0]), hook=_clean_hook(m[1]), say=m[2], body=m[3], cta=m[4]) for m in re.findall(r"## (\d+)\. (.+)\n- Hook[^\n]*\n- Say: (.+)\n- Body: (.+)\n- CTA: (.+)", open("content/swarm-scripts.md").read())]
    for _c in _SW:
        if _sh(_c) not in _led["used"]: s = _c; break
for _i in range(len(S)):
    if s is not None: break
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
# --- tracked experiment: pick voice / music / background per video from content/variant-policy.json (weights learned by post-metrics.mjs)
import random as _rnd
_pol = {}
try: _pol = json.load(open("content/variant-policy.json")).get("weights", {})
except Exception: pass
_slot_seed = int.from_bytes(_hl.md5(f"{day}|{out}".encode()).digest()[:4], "big")
_rg = _rnd.Random(_slot_seed)
def _pick(factor, default):
    w = _pol.get(factor) or {default: 1}
    return _rg.choices(list(w.keys()), weights=list(w.values()))[0]
_variant = {"voice": _pick("voice", "on"), "music": _pick("music", "off"), "bg": _pick("bg", "gradient"), "cta": _pick("cta", "template")}
_force = _os.environ.get("VIDEO_VARIANT")
if _force:
    try: _variant.update(json.loads(_force))
    except Exception: pass
_cta_spoken = re.sub(r"\$?29[^.]*link in bio\.?", "Free step one template, link in my profile.", s["cta"]).replace("link in bio", "link in my profile")  # a URL on screen is not tappable; the profile link is
if _variant.get("cta") == "follow": _cta_spoken = f"Follow for day {_label + 1}."
speech = f"{s['hook']} {s['say']} {_cta_spoken}"
dur, _meta = _rv.render(s["hook"], speech, "receiptspack.vercel.app/free", _label, out, seed=_slot_seed, variant=_variant)
print("variant:", json.dumps(_meta))
_tags = ["provethemwrong","receipts","30daychallenge","fyp","careertok","motivation","selfimprovement"]
try:
    _tj = json.load(open("content/tags.json"))
    if _tj.get("mixes"): _tags = _tj["mixes"][day % len(_tj["mixes"])]["tiktok"]
    elif _tj.get("fallback"): _tags = _tj["fallback"]["tiktok"]
except Exception: pass
_tagstr = " ".join("#"+t for t in _tags)
_cta_line = "the 30-day Receipts system, link in my profile."
try:
    _cb = json.load(open("content/cta-bank.json"))
    if _cb.get("lines"): _cta_line = _cb["lines"][day % len(_cb["lines"])]
    _cta_line = re.sub(r"link in (bio|my profile)\.?", "link in my profile (tap Instagram).", _cta_line)  # TikTok: no tappable website link under 1k followers
except Exception: pass
json.dump(dict(day=(int(sys.argv[3]) if len(sys.argv)>3 else day+1), n=s["n"], hook=s["hook"], caption=f"{s['hook']} — {_cta_line}\n" + _tagstr, duration=dur, **_meta), open(out+".json","w"))
print("ok", out, round(dur,1), "s")
