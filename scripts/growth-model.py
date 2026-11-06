#!/usr/bin/env python3
"""Receipts revenue model — Monte Carlo over heavy-tailed short-form distribution.
Horizon: today -> 2027-01-31 (end of month 3). Target: $50k cumulative (founding brief).
Every input is a benchmark-anchored range; scenarios stack levers cumulatively.
Run: python3 scripts/growth-model.py [runs]
"""
import json, math, random, sys, datetime as dt
random.seed(7)
RUNS = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
TODAY = dt.date(2026, 11, 6); END = dt.date(2027, 1, 31); DAYS = (END - TODAY).days
TARGET = 50_000

# channel medians for <1k-follower accounts (views/post) + follower growth per view
BASE = {"tiktok": 350, "instagram": 600, "youtube": 700}
FOLLOW_RATE = {"tiktok": 0.006, "instagram": 0.004, "youtube": 0.003}   # new followers per view (small accts)
SIGMA = 1.35   # lognormal sigma -> ~5% of posts do >=10x median (the "lottery" tail)

def lognormal(median, sigma): return median * math.exp(random.gauss(0, sigma))

def simulate(p):
    rev = 0.0; leads = 0.0; buyers = 0; cohort = 0
    followers = {"tiktok": 0, "instagram": 0, "youtube": 53}
    ugc_backlog = 0.0
    daily = []
    for d in range(DAYS):
        views_today = 0
        for ch, n in p["posts"].items():
            tier = (1 + followers[ch] / 2000) ** 0.6           # medians scale with audience tier
            for _ in range(n):
                v = lognormal(BASE[ch] * tier * p["quality"], SIGMA)
                views_today += v; followers[ch] += v * FOLLOW_RATE[ch]
        # UGC proof loop: buyers post receipts; each post ~400 median views, tagged back to product
        ugc_posts = ugc_backlog * p["ugc_daily_rate"]; ugc_backlog -= ugc_posts
        for _ in range(int(ugc_posts) + (random.random() < ugc_posts % 1)):
            views_today += lognormal(400, SIGMA)
        # seeded creators (Dec only) — not ads: paid UGC from micro-creators with their own audiences
        if p["seed_creators"] and 24 <= d <= 54 and random.random() < p["seed_creators"] / 31:
            views_today += lognormal(2500, SIGMA)
        clicks = views_today * p["ctr"] + p["manual_visits"]
        # funnel: direct buy + email leads (converted over following 30 days)
        direct = clicks * p["conv_direct"]
        new_leads = clicks * p["lead_rate"]; leads += new_leads
        from_email = leads * (p["email_conv_30d"] / 30); leads -= from_email * 1.0  # leads convert or decay
        leads *= (1 - 1/90)                                   # list decay
        sales = direct + from_email
        n_sales = int(sales) + (random.random() < sales % 1)
        buyers += n_sales; ugc_backlog += n_sales * p["ugc_share"]
        rev += n_sales * p["aov"]
        # high-ticket cohort: % of buyers + % of leads/month
        if p["cohort_price"]:
            c = n_sales * p["cohort_from_buyers"] + leads * (p["cohort_from_leads"] / 30)
            nc = int(c) + (random.random() < c % 1); cohort += nc; rev += nc * p["cohort_price"]
        daily.append(rev)
    return rev, buyers, cohort, followers, daily

def aov(core=29, bump=0, bump_rate=0, up=0, up_rate=0): return core + bump * bump_rate + up * up_rate

SCEN = []
def add(name, **kw):
    base = dict(posts={"tiktok": 2, "instagram": 2, "youtube": 2}, quality=1.0, ctr=0.002, conv_direct=0.01,
                lead_rate=0.0, email_conv_30d=0.0, aov=29, ugc_share=0.0, ugc_daily_rate=0.0,
                cohort_price=0, cohort_from_buyers=0, cohort_from_leads=0, manual_visits=0, seed_creators=0)
    if SCEN: base.update(SCEN[-1][1])
    base.update(kw); SCEN.append((name, base))

add("A. Current pipeline (2 posts/day x3, $29, bio link only)")
add("B. + Volume: 5 YT + 4 IG + 2 TT per day (free slots)", posts={"tiktok": 2, "instagram": 4, "youtube": 5})
add("C. + CTR 0.2% -> 0.5% (spoken URL, on-screen URL, pinned comment)", ctr=0.005)
add("D. + Hook quality from swarm feedback loop (+30% median)", quality=1.3)
add("E. + Email capture on /free (25% of clicks -> lead; 3%/30d -> buy)", lead_rate=0.25, email_conv_30d=0.03, conv_direct=0.012)
add("F. + Price ladder: $29 + $19 bump @25% + $97 upsell @10%", aov=aov(29, 19, .25, 97, .10))
add("G. + Proof loop: 25% of buyers post their receipts (UGC)", ugc_share=0.25, ugc_daily_rate=0.08)
add("H. + $197 cohort: 4% of buyers, 1.5% of leads/mo", cohort_price=197, cohort_from_buyers=0.04, cohort_from_leads=0.015)
add("I. + Founder 30 min/day: communities + comment replies (+150 visits/day)", manual_visits=150)
add("J. + $3k on 40 micro-creator UGC seeds in Dec (not ads)", seed_creators=40)

out = {"horizon_days": DAYS, "target": TARGET, "runs": RUNS, "scenarios": []}
print(f"Horizon {TODAY} -> {END} ({DAYS} days) · target ${TARGET:,} cumulative · {RUNS} runs each\n")
print(f"{'scenario':70} {'P(>=50k)':>9} {'p10':>8} {'median':>9} {'p90':>9} {'buyers':>7}")
for name, p in SCEN:
    res = [simulate(p) for _ in range(RUNS)]
    revs = sorted(r[0] for r in res); buyers = sorted(r[1] for r in res)
    q = lambda a, f: a[int(f * (len(a) - 1))]
    hit = sum(1 for r in revs if r >= TARGET) / RUNS
    row = dict(name=name, p_hit=round(hit, 3), p10=round(q(revs, .1)), median=round(q(revs, .5)), p90=round(q(revs, .9)),
               median_buyers=q(buyers, .5), aov=round(p["aov"], 2))
    out["scenarios"].append(row)
    print(f"{name:70} {hit:9.1%} {row['p10']:8,} {row['median']:9,} {row['p90']:9,} {row['median_buyers']:7,}")
json.dump(out, open("content/growth-model.json", "w"), indent=1)
