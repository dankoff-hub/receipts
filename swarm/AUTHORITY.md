# Authority Ledger

Single source of truth for what the swarm may do without asking, with caps, and what stays with the founder. Agents: if an action is APPROVED here, do it and log it; do not re-request. If FOUNDER-ONLY, prepare the proposal or draft and queue it. Dates are Europe/London. Updated 2026-11-07.

## APPROVED (standing, no re-asking)

| # | Decision | Date | Bounds / how to log |
|---|---|---|---|
| A1 | Operation Revenue Swarm runs autonomously at maximum autonomy on free infrastructure; "don't ask permission once you stumble, continue" | 2026-11-06 | Zero-cost audit (`swarm/audit.mjs`) must pass every cycle |
| A2 | Schedulers: GitHub Actions workflows in this repo and Perplexity automations may be added, split or retimed by the swarm when zero-cost and within platform caps ("double the swarm… increase autonomy lever to the maximum") | 2026-11-06 | Record each new/changed scheduler in `CLAUDE.md`; free-tier minutes only |
| A3 | Channels live: TikTok (Business account since 2026-11-07), Instagram, YouTube (+Shorts), Bluesky, Mastodon, Substack (ops account), email via Mailjet/Gmail ops account, partner DMs on those platforms | 2026-11-06/07 | Excluded for good: X. See F3 for Reddit/Skool/Threads |
| A4 | Posting cadence: 4 video slots + 1 carousel + 1 photo per day per platform via Buffer free; ≥3 concepts/platform/day | 2026-11-06 | Buffer ≤3 channels, no card |
| A5 | Follow/engage: follow back + follow ≤20/day/platform Tier ≤2 lead authors; answer every mention; no unfollow churn | 2026-11-07 | `swarm/COMMUNITY_LOG.json` |
| A6 | Partner programme (lever 2): commission **50% = $14.50/sale**; founding rate 12 months for joins before 2027-01-31; 60-day attribution, last partner link wins; monthly PayPal/Wise payout by the 5th, $30 min, 14-day hold; free pack copy after yes; #ad disclosure; exclusions self-purchase / brand ads / coupon sites / bought traffic / disputes | 2026-11-07 17:26 | `content/partner-program.json`, `docs/partner-offer.md` |
| A7 | Partner sender: the swarm sends outreach itself ("2 but vary timing…"); **≤20 sends/day total, ≤8/platform**, 4 windows (09:40, 13:20, 16:50, 20:30), varied timing and wording, never identical messages; reply sweep + replies in every window; cross-platform (IG DM, Gmail, Substack, YouTube comment, TikTok) | 2026-11-07 | `content/partner-outreach-log.json` via `scripts/partner-log.mjs` (exit 2 at cap) |
| A8 | TikTok and any no-bio-link surface: tracked system link in the first comment on every post, same wording across platforms | 2026-11-07 | `content/` link registry |
| A9 | Voice: en-US-BrianMultilingualNeural, rate +10%, pitch −5Hz; AI avatar disclosed where platform asks | 2026-11-06 | — |
| A10 | Content uniqueness: text and video of every post must differ; never repeat | 2026-11-06 | dedupe hashes in publish pipeline |
| A11 | No money-back guarantee or refund language anywhere; no income claims | 2026-11-07 | BAN regex in `scripts/partner-drafts.mjs`, creative self-check |
| A12 | Operating target $50,000 verified Stripe gross per month; north star $300,000 per month, report-only, not the elimination line | 2026-11-08 | Founder: "target is 50K a month, with north star 300K a month revenue". `swarm/CORE.md`, `scripts/target-check.mjs` |
| A13 | Caps: IG, email, YouTube, TikTok, Threads, Bluesky, Mastodon stay at 8. Substack is 0 until the founder appeal clears. Do not raise a cap on an account that has already been limited. New doors are scouted, not auto-submitted, and only if no account, no card, no badge | 2026-11-08 | Founder: move caps if needed, careful of account blocks. `content/partner-outreach-log.json` `cap_overrides` |

## FOUNDER-ONLY (draft and queue; never execute)

| # | Area | Current state |
|---|---|---|
| F1 | Pricing, bundles, order bumps, the $197 cohort, discounts | $29 fixed. Proposal pending founder decision (growth model scenario H) |
| F2 | Payments, refunds, Stripe account/settings, payouts to partners, any spend of the founder's $3k | Swarm never touches money |
| F3 | Reddit (API approval + posting), Skool (publish queue only), Threads (not logged in), any ToS-sensitive automation | Reddit Support reply of 2026-11-07 unread, founder to action |
| F4 | Legal/compliance text (terms, privacy, disclosures beyond #ad) | Draft only |
| F5 | Account-level changes: new logins, Google OAuth (phone 2FA), password rotation (Instagram, Google), NVIDIA key regeneration, secrets | Reminders stand; swarm never reads or prints secrets |
| F6 | Any paid tool, trial, credit top-up or card entry | Prohibited outright, not even for proposal |
| F7 | Founder time commitments (e.g. 30 min/day community presence, scenario I) | Open decision |

## Change procedure
Approvals are added only by the founder's explicit message. Record: date, exact wording or close paraphrase, bounds, log location. Agents never promote an item from FOUNDER-ONLY to APPROVED.
