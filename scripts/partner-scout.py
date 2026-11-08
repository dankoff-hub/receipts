#!/usr/bin/env python3
"""Partner scout (agent 9). Finds micro-creators (1k–200k subs) in the discipline / journaling / comeback niche on YouTube
using public search pages (no API key), scores fit, records PUBLIC data only (handle, subs, median views, listed links)
in content/partner-prospects.json and drafts outreach copy into a GitHub issue for human send/approval.
Never contacts anyone itself. Rotates 4 queries/day from content/partner-queries.json; refreshes 12 stale prospects/day."""
import json, re, time, urllib.request, urllib.parse, statistics, datetime, os, subprocess, sys
H = {"User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9", "Cookie": "CONSENT=YES+1; SOCS=CAI"}
FIT = ["disciplin", "journal", "consisten", "comeback", "rejection", "rejected", "underestimat", "prove", "motivation", "self improvement", "self-improvement", "accountab", "habit", "mindset", "resilien", "stoic", "30 day", "30-day", "ambitio", "glow up", "side hustle", "documenting"]
NEG = ["quran", "bible", "trading", "crypto", "forex", "asmr", "sticker", "etsy", "scrapbook", "bullet journal art", "planner stickers", "ai automation", "faceless"]
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=25).read().decode("utf8", "ignore")
def num(s):
    m = re.match(r"([\d.]+)([KM]?)", (s or "").replace(",", "")); return int(float(m.group(1)) * {"": 1, "K": 1e3, "M": 1e6}[m.group(2)]) if m else None
def search_channels(q):
    html = get("https://www.youtube.com/results?search_query=" + urllib.parse.quote(q) + "&sp=EgIQAg%253D%253D")
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    if not m: return []
    out = []
    def walk(o):
        if isinstance(o, dict):
            if "channelRenderer" in o: yield o["channelRenderer"]
            for v in o.values(): yield from walk(v)
        elif isinstance(o, list):
            for v in o: yield from walk(v)
    for c in walk(json.loads(m.group(1))):
        out.append({"channel_id": c.get("channelId"), "title": (c.get("title") or {}).get("simpleText"), "subs": num((c.get("videoCountText") or {}).get("simpleText")),
                    "handle": (c.get("navigationEndpoint", {}).get("browseEndpoint", {}).get("canonicalBaseUrl") or "").lstrip("/"), "desc": "".join(r.get("text", "") for r in (c.get("descriptionSnippet") or {}).get("runs", []))[:300]})
    return out
JUNK_IG = {"p", "reel", "reels", "stories", "explore", "accounts", "about", "share", "tv"}
def clean_ig(raw):
    u = (raw or "").split("?")[0].replace("\\u0026", "&").split("&")[0].strip("/").split("/")[-1]
    u = u.split("\\")[0]
    if not re.fullmatch(r"[A-Za-z0-9._]{2,30}", u) or u.lower() in JUNK_IG: return None
    return "instagram.com/" + u
def clean_tt(raw):
    u = (raw or "").split("?")[0].replace("\\u0026", "&").split("&")[0]
    m = re.search(r"tiktok\.com/@([A-Za-z0-9._]{2,30})", u, re.I)
    return ("tiktok.com/@" + m.group(1)) if m else None
def search_video_channels(q):
    html = get("https://www.youtube.com/results?search_query=" + urllib.parse.quote(q))
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    if not m: return []
    out, seen = [], set()
    def walk(o):
        if isinstance(o, dict):
            if "videoRenderer" in o:
                v = o["videoRenderer"]
                owner = (((v.get("ownerText") or {}).get("runs") or [{}])[0])
                url = ((owner.get("navigationEndpoint") or {}).get("browseEndpoint") or {}).get("canonicalBaseUrl") or ""
                handle = url.lstrip("/")
                title = "".join(r.get("text", "") for r in (v.get("title") or {}).get("runs") or [])[:160]
                if handle.startswith("@") and handle not in seen:
                    seen.add(handle)
                    out.append({"handle": handle, "title": owner.get("text") or handle, "desc": title, "channel_id": ((owner.get("navigationEndpoint") or {}).get("browseEndpoint") or {}).get("browseId")})
            for x in o.values(): walk(x)
        elif isinstance(o, list):
            for x in o: walk(x)
    walk(json.loads(m.group(1)))
    return out
def detail(handle, videos=True):
    r = {}
    about = get(f"https://www.youtube.com/{handle}/about")
    m = re.search(r'subscriberCountText\\":\\"([\d.,]+[KM]?) subscribers', about) or re.search(r'"content":"([\d.,]+[KM]?) subscribers"', about)
    r["subs"] = num(m.group(1)) if m else None
    structured = [s.replace("\\u0026", "&").replace("\\\\", "") for s in re.findall(r'"channelExternalLinkViewModel":\{"title":\{"content":"[^"]*"\},"link":\{"content":"([^"]+)"', about)]
    raw_ig = [clean_ig(x) for x in re.findall(r"instagram\.com/([A-Za-z0-9._]{2,30})", about, re.I)]
    raw_tt = re.findall(r"tiktok\.com/@([A-Za-z0-9._]{2,30})", about, re.I)
    r["links"] = sorted(set([s for s in structured if s]))[:8]
    r["ig"] = next((clean_ig(l) for l in r["links"] if "instagram.com/" in l and clean_ig(l)), None) or next((x for x in raw_ig if x), None)
    r["tt"] = next((clean_tt(l) for l in r["links"] if "tiktok.com/" in l and clean_tt(l)), None) or (("tiktok.com/@" + raw_tt[0]) if raw_tt else None)
    r["threads"] = next((l for l in r["links"] if "threads.net/" in l or "threads.com/" in l), None)
    r["substack"] = next((l for l in r["links"] if "substack.com" in l), None)
    r["has_email"] = bool(re.search(r'"businessEmailLabel"|"businessEmailRevealButton"', about))  # email exists but sits behind a human check (founder-only)
    r["site"] = next((l for l in r["links"] if not re.search(r"instagram|tiktok|facebook|twitter|x\.com|threads|t\.me|linktr|youtube|substack", l)), None)
    if videos and r["subs"] and 1000 <= r["subs"] <= 200000:
        html = get(f"https://www.youtube.com/{handle}/videos")
        vs = [num(x) for x in re.findall(r'"simpleText":"([\d.,]+[KM]?) views"', html)][:15]
        pubs = re.findall(r'"publishedTimeText":\{"simpleText":"([^"]+)"\}', html); r["latest"] = pubs[0] if pubs else None
        vid = re.search(r'"videoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})"', html); r["latest_video"] = f"https://www.youtube.com/watch?v={vid.group(1)}" if vid else None
        if len([v for v in vs if v]) < 3:
            html2 = get(f"https://www.youtube.com/{handle}/shorts"); vs += [num(x) for x in re.findall(r'"([\d.,]+[KM]?) views"', html2)][:15]
        vs = [v for v in vs if v]; r["median_views"] = int(statistics.median(vs)) if vs else None; r["max_views"] = max(vs) if vs else None
    return r
def score(p):
    text = (p.get("title", "") + " " + p.get("desc", "")).lower()
    if any(n in text for n in NEG): return 0
    fit = sum(1 for k in FIT if k in text); subs = p.get("subs") or 0; mv = p.get("median_views") or 0
    if not (1000 <= subs <= 200000): return 0
    s = min(fit, 4) * 15 + (20 if mv >= 1000 else 10 if mv >= 200 else 0) + (40 if p.get("ig") else 0) + (20 if p.get("tt") else 0) + (5 if p.get("site") else 0)
    if p.get("latest") and re.search(r"year", p["latest"]): s -= 20
    if not p.get("ig") and not p.get("tt"): s = min(s, 25)  # no sendable route; do not clog the 20/day cap
    return max(0, s)
def main():
    os.makedirs("content", exist_ok=True)
    path = "content/partner-prospects.json"; data = json.load(open(path)) if os.path.exists(path) else {"updated": None, "prospects": {}}
    queries = json.load(open("content/partner-queries.json")); doy = datetime.date.today().timetuple().tm_yday
    todays = [queries[(doy * 4 + i) % len(queries)] for i in range(4)]
    found = {}
    for q in todays:
        try:
            for c in search_video_channels(q) + search_channels(q):
                if c.get("handle") and c["handle"] not in data["prospects"] and c["handle"] not in found: found[c["handle"]] = c
        except Exception as e: print("search err", q, e)
        time.sleep(1)
    def rank(c):
        t = ((c.get("title") or "") + " " + (c.get("desc") or "")).lower()
        if any(n in t for n in NEG): return -1
        return sum(1 for k in FIT if k in t)
    ranked = sorted([c for c in found.values() if rank(c) >= 0], key=rank, reverse=True)
    print("new candidates", len(found), "ranked", len(ranked))
    kept = detailed = 0
    for c in ranked:
        if detailed >= 18 or kept >= 8: break
        h = c["handle"]
        try: c.update(detail(h))
        except Exception as e: c["error"] = str(e)
        detailed += 1
        c["score"] = score(c); c["status"] = "prospect" if c["score"] >= 40 and (c.get("ig") or c.get("tt")) else "low-fit"; c["found"] = str(datetime.date.today()); c["url"] = f"https://www.youtube.com/{h}"
        if c["status"] == "prospect": kept += 1
        data["prospects"][h] = c; time.sleep(0.45)
    print("detailed", detailed, "new sendable", kept)
    # refresh stale
    stale = sorted([(v.get("checked", ""), k) for k, v in data["prospects"].items() if v.get("status") in ("prospect", "contacted", "partner")])[:12]
    for _, h in stale:
        try: data["prospects"][h].update(detail(h)); data["prospects"][h]["checked"] = str(datetime.date.today()); data["prospects"][h]["score"] = score(data["prospects"][h])
        except Exception as e: data["prospects"][h]["error"] = str(e)
        time.sleep(0.6)
    data["updated"] = datetime.datetime.utcnow().isoformat() + "Z"
    json.dump(data, open(path, "w"), indent=1)
    top = sorted([v for v in data["prospects"].values() if v.get("status") == "prospect"], key=lambda v: -v["score"])[:10]
    print("outreach queue:", [(t["handle"], t["score"]) for t in top])
    if os.environ.get("GITHUB_TOKEN") and top:
        tpl = open("docs/partner-offer.md").read().split("<!-- DM -->")[1].split("<!-- /DM -->")[0].strip()
        body = "Top uncontacted prospects (public data). Founder or approved sender posts the message, then sets status=contacted in content/partner-prospects.json.\n\n"
        for t in top:
            first = (t.get("title") or t["handle"]).split()[0]
            body += f"### {t.get('title')} — {t['url']}\nsubs {t.get('subs')} · median views {t.get('median_views')} · IG {t.get('ig') or '—'} · site {t.get('site') or '—'} · score {t['score']}\n\n```\n{tpl.replace('{first}', first).replace('{code}', re.sub('[^a-z0-9]', '', t['handle'].lower())[:16])}\n```\n\n"
        title = f"Partner outreach queue {datetime.date.today()}"
        try: subprocess.run(["gh", "issue", "create", "--title", title, "--body-file", "-"], input=body, text=True, check=True)
        except Exception as e: print("issue skipped", e)
if __name__ == "__main__": main()
