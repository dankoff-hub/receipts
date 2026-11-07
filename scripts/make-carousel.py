#!/usr/bin/env python3
"""Instagram carousel generator: picks the next UNUSED script (shared content/script-ledger.json, so a script
never appears twice in any format), renders 6 slides 1080x1350 (cover / 3-4 points / CTA) with PIL,
writes public/carousels/<name>/1..6.png + <name>.json sidecar (unique IG caption, md5 in caption-ledger).
Usage: python3 scripts/make-carousel.py <idx> <name> <label>
"""
import hashlib, json, os, re, sys, textwrap
from PIL import Image, ImageDraw, ImageFont

idx = int(sys.argv[1]); name = sys.argv[2]; label = int(sys.argv[3]) if len(sys.argv) > 3 else idx
W, H = 1080, 1350
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
PALETTES = [((15, 23, 42), (49, 46, 129)), ((26, 26, 26), (124, 45, 18)), ((4, 47, 46), (15, 23, 42)), ((59, 7, 100), (12, 10, 9)), ((17, 24, 39), (6, 95, 70))]
GOLD = (242, 201, 76); WHITE = (255, 255, 255); GREY = (200, 200, 200)
URL = "receipts-blond.vercel.app/free"

md = open("content/launch-scripts.md").read()
if os.path.exists("content/forge-scripts.md"): md += "\n" + open("content/forge-scripts.md").read()
S = [dict(n=int(m[0]), hook=re.sub(r"\s*\[[^\]]*\]\s*$", "", m[1]).strip(), say=m[2], body=m[3], cta=m[4]) for m in re.findall(r"## (\d+)\. (.+)\n- Hook[^\n]*\n- Say: (.+)\n- Body: (.+)\n- CTA: (.+)", md)]
led_p = "content/script-ledger.json"
try: led = json.load(open(led_p))
except Exception: led = {"used": []}
sh = lambda x: hashlib.md5((x["hook"] + "|" + x["say"]).encode()).hexdigest()
s = next((S[(idx + i) % len(S)] for i in range(len(S)) if sh(S[(idx + i) % len(S)]) not in led["used"]), None)
if s is None: s = S[(idx * 7) % len(S)]  # pool exhausted: rotate (forge refills)
else: led["used"].append(sh(s)); json.dump(led, open(led_p, "w"))

def bg(seed):
    a, b = PALETTES[seed % len(PALETTES)]
    im = Image.new("RGB", (W, H)); px = im.load()
    for y in range(H):
        t = y / H
        row = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
        for x in range(W): px[x, y] = row
    # vignette
    ov = Image.new("L", (W, H), 0); d = ImageDraw.Draw(ov)
    d.ellipse((-W * 0.3, -H * 0.2, W * 1.3, H * 1.2), fill=255)
    from PIL import ImageFilter
    ov = ov.filter(ImageFilter.GaussianBlur(220))
    dark = Image.new("RGB", (W, H), (0, 0, 0))
    return Image.composite(im, dark, ov.point(lambda v: 90 + v * 165 // 255))

def fit(draw, text, size, maxw, minsize=44):
    while size > minsize:
        f = ImageFont.truetype(FONT, size)
        lines = textwrap.wrap(text, max(8, int(maxw / (size * 0.56))))
        if all(draw.textlength(l, font=f) <= maxw for l in lines) and len(lines) * size * 1.25 < H * 0.6: return f, lines
        size -= 4
    f = ImageFont.truetype(FONT, minsize); return f, textwrap.wrap(text, max(8, int(maxw / (minsize * 0.56))))

def slide(i, total, title, body=None, kicker=None, cta=False):
    im = bg(idx + i); d = ImageDraw.Draw(im)
    small = ImageFont.truetype(FONT, 30); tiny = ImageFont.truetype(FONT_R, 28)
    d.text((70, 60), "RECEIPTS", font=small, fill=GREY); d.text((W - 70 - d.textlength(f"{i}/{total}", font=small), 60), f"{i}/{total}", font=small, fill=GREY)
    # progress ticks
    for k in range(total):
        d.rounded_rectangle((70 + k * ((W - 140) / total), 110, 70 + (k + 1) * ((W - 140) / total) - 8, 118), 4, fill=GOLD if k < i else (80, 80, 80))
    f, lines = fit(d, title, 96 if i == 1 else 80, W - 160)
    lh = int(f.size * 1.22); y = (H - lh * len(lines) - (220 if body else 0)) // 2 - 40
    if kicker: d.text((80, y - 70), kicker, font=ImageFont.truetype(FONT, 34), fill=GOLD)
    for ln in lines: d.text((80, y), ln, font=f, fill=WHITE); y += lh
    if body:
        fb = ImageFont.truetype(FONT_R, 44); y += 30
        for ln in textwrap.wrap(body, 42): d.text((80, y), ln, font=fb, fill=GREY); y += 58
    if i == 1: d.text((80, H - 150), "swipe  →", font=ImageFont.truetype(FONT, 40), fill=GOLD)
    if cta:
        d.rounded_rectangle((80, H - 330, W - 80, H - 200), 24, fill=GOLD)
        t = "Free Step 1 template"; fc = ImageFont.truetype(FONT, 46)
        d.text(((W - d.textlength(t, font=fc)) / 2, H - 300), t, font=fc, fill=(20, 20, 20))
        d.text(((W - d.textlength(URL, font=small)) / 2, H - 180), URL, font=small, fill=WHITE)
    else:
        d.text((80, H - 90), URL, font=tiny, fill=(160, 160, 160)); d.text((W - 80 - d.textlength(f"Day {label}", font=tiny), H - 90), f"Day {label}", font=tiny, fill=(160, 160, 160))
    return im

sents = [x.strip() for x in re.split(r"(?<=[.?!])\s+", s["say"]) if x.strip()][:4]
pts = sents if len(sents) >= 2 else [s["say"], s["body"]]
total = len(pts) + 2
out = f"public/carousels/{name}"; os.makedirs(out, exist_ok=True)
slide(1, total, s["hook"]).save(f"{out}/1.png")
for k, p in enumerate(pts, start=2): slide(k, total, p, kicker=f"0{k-1}").save(f"{out}/{k}.png")
slide(total, total, "Thirty days. One standard. Proof you can hold.", body="Step 1 is free. The full 30-day Receipts system is $29.", cta=True).save(f"{out}/{total}.png")

# unique Instagram caption (different from the Reel captions: carousel-specific wording)
cl_p = "content/caption-ledger.json"
try: cl = json.load(open(cl_p))
except Exception: cl = {"used": []}
tags = ["receipts", "provethemwrong", "30daychallenge", "discipline", "selfimprovement", "mindset", "carousel"]
try:
    tj = json.load(open("content/tags.json")); mix = tj["mixes"][idx % len(tj["mixes"])]
    tags = (mix.get("instagram") or mix.get("tiktok") or tags)[:8]
except Exception: pass
tpls = [
    lambda: f"{s['hook']}\n\nSwipe: {len(pts)} points, one standard, thirty days of evidence.\n\nSave this for the day you want to quit.\n\nFree Step 1 template in bio.\n\n" + " ".join("#" + t for t in tags),
    lambda: f"{s['hook']}\n\n{pts[0]}\n\nThe rest is in the slides. Save it, then start day one.\n\nFree Step 1 template in bio.\n\n" + " ".join("#" + t for t in tags),
    lambda: f"Day {label} of 30.\n\n{s['hook']}\n\nSwipe for the standard. Comment 'receipt' if you're starting this week.\n\n" + " ".join("#" + t for t in tags),
]
caption = None
for a in range(len(tpls) * 2):
    c = tpls[(idx + a) % len(tpls)]() + ("" if a < len(tpls) else f"\n\nPost {idx}.")
    if hashlib.md5(c.encode()).hexdigest() not in cl["used"]: caption = c; break
caption = caption or tpls[0]() + f"\n\nCarousel {idx}."
cl["used"].append(hashlib.md5(caption.encode()).hexdigest()); json.dump(cl, open(cl_p, "w"))
json.dump(dict(day=label, n=s["n"], hook=s["hook"], slides=total, caption=caption), open(f"{out}.json", "w"), indent=1)
print("ok", out, total, "slides")
