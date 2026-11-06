# Growth plan: what must be true to reach $50k by 2027-01-31

Model: `scripts/growth-model.py` (Monte Carlo, heavy-tailed views, 86-day horizon). Output: `content/growth-model.json`, posted daily on the audience issue.
Benchmarks: <1k-follower TikTok median ~330–400 views/post; Reels ~600; Shorts a few hundred–1,300; bio-link CTR 0.1–0.3% of views; cold click→buy 0.3–1.5%; order bump 15–35%; upsell 10–25%.

| Lever | Owner | Status |
|---|---|---|
| B. 4 slots/day: TikTok 2, Instagram 4, YouTube 4 | swarm | DEPLOYED (daily-tiktok.yml, publish-pending caps) |
| C. CTR: on-screen URL in every video + URL in captions | swarm | DEPLOYED (make-video.py, caption-studio.mjs) |
| D. Hook quality: virality-swarm/strategy-brief feedback | swarm | running; TODO pull per-video views into audience-history |
| E. Email capture on /free (lead → 30-day sequence) | founder + swarm | NEEDS a free email account (MailerLite free: 1k subs). Swarm writes the sequence once the API key is a GitHub secret |
| F. Price ladder: $29 core + $19 order bump + $97 upsell | founder | NEEDS Stripe products (payment-link cross-sell + post-purchase link). Swarm key is read-only |
| G. Proof loop: buyers post receipts, tag #receipts | swarm | content asks for it; add "post your day-7 receipt" step inside the pack |
| H. $197 "30-Day Receipts Cohort" (async, Discord/Telegram) | founder | product decision; doubles median revenue in the model |
| I. Founder 30 min/day: communities + comment replies | founder | load-bearing: median ~$22k → ~$46k |
| J. $3k → 40 micro-creator UGC seeds in December (not ads) | founder | P(≥$50k) → ~20%; payments are founder-only by rule |

Honest read: content swarm alone (A–H) ≈ $20–25k median. $50k needs I + J, and even then ~1-in-5; median ~$48k. Survival gate (`SWARM_TARGET_MONTHLY`=300000) is 6x the founding brief — reconcile.
