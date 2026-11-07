# GOALS — Operation Revenue Swarm (Absolute Zero)
- Master target: $50,000 attributed Receipts Pack revenue ($29 one-time) by 2027-01-31 (month 3 of bootstrap). Founder budget $3k is founder-only; the swarm spends $0.
- Zero-cost constraint (inviolable): no card, no paid tier, no auto-billing trial anywhere in the swarm.
- Channels: Instagram (focus), YouTube (focus), TikTok, Bluesky, Mastodon. No X. No paid ads.
- Leading KPI (2026-11-07): followers on every platform — they are the funnel into /free → $29. Every video/carousel/caption carries a follow ask; the `community` stage follows back, answers every mention and follows ≤FOLLOW_DAILY_CAP (20/day/platform) Tier ≤2 lead authors. No unfollow churn, ever. Follower counts tracked daily by audience-watch (`followers_total_known`).
- Daily: ≥3 concepts/platform, 4 video slots + 1 carousel + 1 photo already scheduled; every CTA carries a tracked src (client_reference_id) into Stripe.
- Hunter: find high-intent public posts (Reddit, Bluesky); Tier 1 → Closer (human-approved reply until posting accounts exist); Tier 2 → nurture content; Tier 3 → UGC pool.
- Stop conditions: target verified in Stripe; or all cascade providers + local fallback exhausted (log to QUOTA_STATE.json, resume next cron).
