# GOALS — Operation Revenue Swarm (Absolute Zero)
- Operating target (founder, 2026-11-08): **$50,000 verified Stripe gross per month**. Not a one-time $50k by 2027-01-31. At $29 that is 1,724 sales/month, about 58/day. Founder budget $3k is founder-only; the swarm spends $0.
- North star, report-only: **$300,000 per month** (10,345 sales). Never the elimination threshold. Do not fabricate progress toward either number.
- Per-run operating prompt: swarm/CORE.md. Approvals and caps: swarm/AUTHORITY.md. Long-form reference: swarm/reference/MASTER_PROMPT.md.
- Zero-cost constraint (inviolable): no card, no paid tier, no auto-billing trial anywhere in the swarm.
- Channels: Instagram (focus), YouTube (focus), TikTok, Bluesky, Mastodon. No X. No paid ads.
- Leading KPI (2026-11-07): followers on every platform — they are the funnel into /free → $29. Every video/carousel/caption carries a follow ask; the `community` stage follows back, answers every mention and follows ≤FOLLOW_DAILY_CAP (20/day/platform) Tier ≤2 lead authors. No unfollow churn, ever. Follower counts tracked daily by audience-watch (`followers_total_known`).
- Daily: ≥3 concepts/platform, 4 video slots + 1 carousel + 1 photo already scheduled; every CTA carries a tracked src (client_reference_id) into Stripe.
- Hunter: find high-intent public posts (Reddit, Bluesky); Tier 1 → Closer (human-approved reply until posting accounts exist); Tier 2 → nurture content; Tier 3 → UGC pool.
- Stop conditions: target verified in Stripe; or all cascade providers + local fallback exhausted (log to QUOTA_STATE.json, resume next cron).
