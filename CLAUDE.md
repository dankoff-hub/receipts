# CLAUDE.md — Receipts Pack autonomous pipeline

Handover context for Claude (Code or chat). Read this first; it is the full operating manual.

## Product

**Receipts Pack** — $29 one-time digital product (B2C). A 30-day system that turns rejection/spite into a measurable standard: receipt → standard → 30-day proof plan → Arrival Check → 7-day bridge.

- Landing: https://receipts-blond.vercel.app
- Bio page (TikTok/Instagram bio link): https://receipts-blond.vercel.app/bio
- Stripe payment link ($29, live): https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a
- Delivery page (unlisted, post-purchase redirect target): https://receipts-blond.vercel.app/pack/tkkgjvizitzg
- Repo (private): https://github.com/dankoff-hub/receipts
- TikTok: @user6155581825874 · Instagram: connected via Buffer (same video pipeline)

## Architecture

- **Site:** Next.js 14 (`app/`), hosted on Vercel, deployed by `.github/workflows/deploy.yml` on push (uses `VERCEL_TOKEN`). Vercel CLI/connector is unreliable for this account — always deploy via GitHub Actions.
- **Videos:** `scripts/make-video.py <day_index> <out.mp4>` — edge-tts voiceover + ffmpeg text cards, 1080×1920, dark bg `#0b0b0c`, DejaVuSerif-Bold, ~16–21s. Scripts from `content/launch-scripts.md` (30 scripts, `Say:` lines).
  - **Voice: `en-US-BrianMultilingualNeural`, rate `+10%`, pitch `-5Hz`** — user-approved final. Do not change without explicit instruction. Fallback if edge-tts fails: espeak-ng.
- **Publishing:** Buffer GraphQL API (`https://api.buffer.com`, Bearer `BUFFER_API_KEY`). Free plan: 3 channels max, 2 in use (TikTok + Instagram). 10 queued posts per channel.
  - `scripts/publish-buffer.mjs` — TikTok, `addToQueue`, runs when a new daily video exists.
  - `scripts/cross-post-instagram.mjs` — Instagram Reels, `shareNow`, metadata `{instagram:{type:reel,shouldShareToFeed:true}}`. Runs only on new daily videos (never on manual dispatch — prevents duplicates).
  - `scripts/buffer-poster.js` — manual TikTok repost (`shareNow`) when `state/publish-queue.json` contains `"when": "now"`. Clear the queue after use.
  - Video assets are public URLs (`/videos/day-NNN.mp4`); scripts poll until Vercel serves them (200) before posting. TikTok rejects videos <3s.
- **Revenue scoreboard:** `scripts/target-check.mjs` — sums completed Stripe Checkout Sessions via `STRIPE_API_KEY` (restricted read-only `rk_live_…`, Checkout Sessions: Read). 30-day cycles from launch **2026-11-03**, target **$300,000/cycle**. Verdicts: `SURVIVING` / `AT RISK — ELIMINATION IN N DAYS` / `TARGET ACHIEVED — SWARM PROMOTED`. Embedded in the daily brief issue via `scripts/daily-brief.mjs`. The "swarm survival/elimination" framing is the owner's motivational construct — honor it in reporting, but it only reads Stripe data; it controls nothing.
- **Guerrilla marketing:** `scripts/guerrilla-bot.mjs` → `content/guerrilla-output.json` (comment templates, Reddit drafts, influencer outreach). Posts a daily issue. Content is for the human to post manually — bots posting to Reddit/Skool risk bans.

## Workflows (`.github/workflows/`)

| Workflow | Trigger | Does |
|---|---|---|
| `daily-tiktok.yml` | cron `0 6 * * *` (06:00 UTC) + dispatch | Make new day's video → commit → TikTok queue + Instagram Reel → daily brief issue (with swarm verdict) |
| `virality-swarm.yml` | cron `0 5 * * *` + dispatch | Scout/Alchemist/Curator trend hooks + tag-scout hashtag refresh |
| `growth-swarm.yml` | cron `30 5 * * *` + dispatch | Competitor watch → CTA lab → objection lab → pool guard (content-only, guard blocks non-content commits) |
| `guerrilla-bot.yml` | cron `0 12 * * *` + dispatch | Generate guerrilla content, daily issue |
| `deploy.yml` | push | Vercel deploy |
| `ci.yml` | push/PR | Build check |

Day counter: `N = (now - 2026-11-03)/86400`, video file `public/videos/day-%03d(N+1).mp4`. Idempotent: skips when the day's file exists.

## Secrets (GitHub repo secrets — names only, values never leave GitHub)

- `BUFFER_API_KEY` — Buffer GraphQL API key
- `VERCEL_TOKEN` — Vercel deploy token
- `STRIPE_API_KEY` — Stripe restricted read-only key (Checkout Sessions: Read)

**Hard rule:** never print, read, or exfiltrate secret values. All posting happens inside workflows. If a secret breaks, ask the user to re-add it via repo Settings → Secrets → Actions.

## Operations cheatsheet

```bash
# Trigger a run / check status / read logs
gh workflow run daily-tiktok.yml -R dankoff-hub/receipts
gh run view <runId> -R dankoff-hub/receipts --json status,conclusion
J=$(gh api repos/dankoff-hub/receipts/actions/runs/<runId>/jobs --jq '.jobs[0].id')
gh api repos/dankoff-hub/receipts/actions/jobs/$J/logs | sed 's/\x1b\[[0-9;]*m//g'

# Manual TikTok repost: set queue → push → dispatch → clear queue after
echo '[{"video":"day-001.mp4","when":"now"}]' > state/publish-queue.json

# Site checks (expect: 200 text/html, 200 video/mp4, 200 application/json)
curl -sI https://receipts-blond.vercel.app/bio | head -1
curl -sI https://receipts-blond.vercel.app/videos/day-001.mp4 | head -1
```

## Constraints (user-standing)

- No paid ads anywhere. No X/Twitter. TikTok is the primary channel.
- Minimal compute: 1 video/day, 2 workflows/day total. Don't add crons without asking.
- One voice: BrianMultilingualNeural +10%/−5Hz, used consistently.
- Never paste secrets in chat. User adds secrets via GitHub UI.

## State at handover (2026-11-03)

- Day 1 live on TikTok (Brian voice, post id `6aea54240a183b1b742e9031`) and Instagram Reels (Eric-voice earlier render, id `6aea492ba8918d96047e31ee`). Older Eric/Guy/Andrew Day-1 duplicates exist on TikTok — user may delete manually.
- Revenue: $0, 0 sales. Swarm: AT RISK — elimination in 29 days at handover.
- User confirmed done: bio link in TikTok profile, Stripe product renamed, after-payment redirect set. Verify before trusting.

## Migration checklist for Claude

1. Clone the repo and authenticate `gh` as the user.
2. Verify repo secrets exist: `gh secret list -R dankoff-hub/receipts` (expect 3). Do not attempt to read them.
3. Everything else is platform-neutral: Vercel, Buffer, Stripe all live outside the chat environment.
4. The Perplexity-side Stripe credential vault entry does **not** migrate — for ad-hoc revenue checks in Claude, use the same read-only key (user re-adds it) or trigger the workflow and read the daily brief issue.
5. First action: run `node scripts/target-check.mjs` logic via a workflow dispatch and confirm the verdict line in the latest daily brief issue.

## Status 2026-11-04 06:45 UTC
- Avatar intro video LIVE: public/videos/avatar-intro.mp4 (15.7s, 1080x1920, SadTalker + Brian voice, visible "AI avatar" label + AI disclosure in caption).
- Posted: TikTok (queued 12:18 UTC), Instagram Reel, YouTube Short — all via Buffer. YouTube now the 3rd Buffer channel; cross-post-youtube.mjs needs metadata {title, categoryId:"22", privacy, madeForKids}.
- avatar-render.yml: working (CPU SadTalker, ~50-105 min, no enhancer pass). Vercel deploy INSIDE workflows can hang — if so, push any commit and use publish-avatar.yml to post.
- Site funnel: /bio (Rosa brand, src-tracked Stripe links) → /free (ungated Step 1) → $29 pack. Footer disclaimers removed by design.
