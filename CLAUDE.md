# CLAUDE.md — Receipts Pack autonomous pipeline

Handover context for Claude (Code or chat). Read this first; it is the full operating manual.

## Product

**Receipts Pack** — $29 one-time digital product (B2C). A 30-day system that turns rejection/spite into a measurable standard: receipt → standard → 30-day proof plan → Arrival Check → 7-day bridge.

- Landing: https://receiptspack.vercel.app
- Bio page (TikTok/Instagram bio link): https://receiptspack.vercel.app/bio
- Stripe payment link ($29, live): https://buy.stripe.com/dRm7sEfUs0CQbscfSx3840a
- Delivery: Stripe redirect → https://receiptspack.vercel.app/pack?session_id={CHECKOUT_SESSION_ID} (verified paid via Stripe API; fallback /pack email form). Content lives in PRIVATE repo dankoff-hub/receipts-pack, bundled at deploy time (deploy.yml, PACK_DEPLOY_KEY) into lib/pack-bundle.json (placeholder in git). Old unlisted /pack/tkkgjvizitzg removed 2026-11-06 (leaked when repo went public).
- Repo (private): https://github.com/dankoff-hub/receipts
- TikTok: @dan.rosa71 (new account 2026-11-06; old @user6155581825874 banned; Buffer channel 6aee32c6e29c69a1718774ff) · Instagram: connected via Buffer (same video pipeline)

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

| Workflow | Trigger (UTC) | Does |
|---|---|---|
| `daily-tiktok.yml` | cron 08/12/16/20 + dispatch | Generate the slot's unique video/carousel → commit → Buffer queue (TikTok cap 2/day, Instagram, YouTube) → post-log ledger |
| `virality-swarm.yml` | cron 05:00 | Scout/Alchemist/Curator trend hooks + hashtag refresh |
| `growth-swarm.yml` | cron 05:30 | Competitor watch → CTA lab → objection lab → pool guard |
| `audience-watch.yml` | cron 07:00 | Follower/engagement snapshot per channel → audience-history.json |
| `journey-check.yml` | cron 07:30 + dispatch | Read-only customer journey: all pages, Stripe link, subscribe API, **Playwright iPhone QA** (`scripts/mobile-qa.mjs`, fails on overflow / <44px taps / <12px text / <4.5 contrast) |
| `guerrilla-bot.yml` | cron 12:00 | Guerrilla content + daily issue |
| `revenue-swarm.yml` | cron every 2h at :30 | Lead discovery → creative → attribution ledger |
| `day1-reminder.yml` | cron hourly :15 | Day-1 reminder send (exit 0 / skip while Mailjet is unconfigured → API 503) |
| `partner-swarm.yml` | cron 09:00 | Agent 9: Stripe partner ledger (`aff_<code>` in client_reference_id → `content/affiliate-ledger.json`, payout statement issue on the 1st–5th) + partner scout (public YouTube channel search, 1k–200k subs, fit score → `content/partner-prospects.json`, daily "Partner outreach queue" issue) + `partner-drafts.mjs` (one unique LLM-written DM/email per prospect). Sending is done by 3 Perplexity automations (10:20/14:45/19:10 London, ≤20/day, `docs/partner-sender.md`); never pays anyone. |
| `content-forge.yml` | cron Sun 04:00 | Weekly script/caption bank refresh |
| `avatar-render.yml` | cron Fri 08:00 | Weekly avatar video rotation (long CPU render) |
| `deploy.yml` / `ci.yml` | push | Vercel deploy / build check |

All committing workflows push through `scripts/git-push-safe.sh` (rebase, union-merge of JSON ledgers, retries) so concurrent runs no longer fail on push races.

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
curl -sI https://receiptspack.vercel.app/bio | head -1
curl -sI https://receiptspack.vercel.app/videos/day-001.mp4 | head -1
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

## Content uniqueness rules (2026-11-04)
- EVERY post differs: caption-studio.mjs writes per-channel captions (captions.tiktok/instagram/youtube/ytTitle) into each video sidecar; publish-buffer/cross-post-* read their own channel caption. Never post meta.caption verbatim to all three.
- Never repeated: content/caption-ledger.json (caption md5), content/script-ledger.json (script md5 — make-video.py picks first unused), content/avatar-ledger.json (avatar slug used once). Commit ledger files with every video commit.
- Avatar (real-person video) is a WEEKLY Friday 08:00 UTC rotation (avatar-render.yml, scripts in assets/avatar-scripts/<slug>.{txt,wav,json}), NOT in every post. Daily 06:00 UTC videos stay text-card format.

## Audience watch (added 2026-11-04)
- audience-watch.mjs runs daily 07:00 UTC (audience-watch.yml): YouTube subs/views (public page parse), TikTok followers, Instagram (usually login-walled -> null), Stripe paid-by-src, Buffer post delivery verification. Writes content/audience-history.json, strategy-brief.json, and a daily "Audience watch" issue.
- Feedback loop: caption-studio reads strategy-brief.json (best_cta_index/best_tag_mix_index) and biases rotations once 7-day growth >= +5; before that it collects baselines with no bias.
- All three publishers append to content/post-log.json (postId, channel, captionHash) — audience-watch verifies delivery and flags failures in its issue.

## Two-slot daily pipeline (2026-11-05)
- daily-tiktok.yml now runs 11:00 + 19:00 UTC ("am"/"pm" slots). pm slot makes day-XXXb.mp4 (make-video.py 3rd arg = label, script index = N*2+slot for unique scripts).
- publish-pending.mjs is the single entry point for posting: oldest not-yet-posted video per channel, max 1/channel/run, hard cap 2/channel/day (avatar posts count). Self-heals after cancelled runs. Entry "status: skipped" marks a video intentionally NOT for a channel.
- In-job "vercel deploy" hangs are why runs died Nov 4-5: workflows must NOT call the Vercel CLI. Daily dispatches deploy.yml instead; deploy.yml has timeout-minutes: 15. Jobs have timeout-minutes: 60.
- TikTok uses mode: shareNow (fixed 2x/day slots make queue timing wrong).
- KNOWN GAP: first video of a run lands right at run start, not at the slot's social peak — Buffer per-channel queue times would fix timing; block backfill until then.

## Posting consistency fixes (2026-11-05)
- check-posts.mjs (daily, before audience-watch) reconciles post-log against Buffer statuses (sent/error/scheduled) per channel; publish-pending retries failed up to 2 attempts. Run it after any suspected missed post.
- post-log statuses: sent (confirmed by Buffer), queued (Buffer scheduled), skipped (intentionally NOT posted to that channel, e.g. day-001 on YouTube), failed (Buffer error).
- avatar-render.yml commit step now includes avatar-out/ — raw renders were being committed to an ignored dir and lost (01-intro recovered from run artifact 41776261200).
- TikTok queue accepts only 1 video post per 24h per account on Buffer free — keep daily posts at the 2 cron slots, don't add a third.


## 2026-11-06 — Growth model + 4-slot pipeline
- `scripts/growth-model.py` = Monte Carlo revenue model (benchmarks in content/growth-plan.md). Runs daily in audience-watch.yml, comments on the audience issue, writes content/growth-model.json.
- daily-tiktok.yml now has 4 slots (08/12/16/20 UTC → suffix "", b, c, d; idx = N*4+S). publish-pending caps: TikTok 2, Instagram 4, YouTube 4.
- Every video carries an on-screen URL (receiptspack.vercel.app/free); YT/IG captions include the URL.
- Founder-owned levers (Stripe price ladder, email service, $197 cohort, $3k creator seeding, 30 min/day community time) are in content/growth-plan.md — swarm must not do payments/legal.

## 2026-11-06 — TikTok ban
- Buffer error on all TikTok posts since Nov 5 19:00 UTC: "TikTok account being banned" (@user6155581825874). Likely cause: 7 API posts in ~40 min on a brand-new account on Nov 3.
- `scripts/channel-health.mjs` (daily in audience-watch, also `channel-health.yml` dispatch) auto-pauses a channel in content/audience-config.json `paused.<svc>.until` (3 days) on ban/disconnect; publish-pending skips paused channels; one re-probe post after the pause, unpause when it sends.
- Only the founder can appeal in the TikTok app. If a new TikTok account is created: warm up manually, max 1 API post/day for the first 2 weeks.

## 2026-11-06 — Audience bet (Instagram + YouTube)
- Ground truth from Buffer metrics (scripts/post-metrics.mjs): v1 videos got 0–7 views on Shorts, 0 reach on Reels, 3.7–5.3s avg watch on TikTok. Diagnosis: first-3-seconds retention, not volume.
- `scripts/render-v2.py` is now the renderer (make-video.py calls it): animated gradient bg, 1.6s hook card, word-level karaoke captions from edge-tts WordBoundary, progress bar, URL end card + "follow for day N". Spoken CTA = "free step one template, link on screen".
- Daily loop: post-metrics.mjs → strategy-brief.performance (medians, top/bottom hooks, breakouts ≥3x median) → content-forge prompt uses real best/worst hooks. content/audience-scoreboard.json tracks the bet (baseline 2026-11-06: YT 53 subs, Shorts median 3 views, Reels 0).
- TODO next: Instagram carousel (PIL slides) 1/day via Buffer image post; YouTube titles as search questions; IG follower count (Buffer does not expose it).

## 2026-11-06 — Instagram carousels
- Slot b (12:00 UTC) also runs `scripts/make-carousel.py` (PIL, 6 slides 1080x1350, next unused script from the shared script-ledger, unique caption in caption-ledger) → public/carousels/car-NNN/, then `scripts/post-carousel.mjs` posts it to Instagram via Buffer (image assets, logged as channel `instagram_carousel`, separate from the 4 Reel slots). Forge COUNT raised to 40/week to keep the pool ahead of 35 scripts/week.
- Vercel CLI pinned to 65.11.0 in deploy.yml: 65.12.0 (released 2026-11-05 23:40 UTC) hangs at "Loading teams…" in GitHub Actions; 13 deploys were cancelled at 15 min on Nov 6 until pinned. If deploys hang again, check `npm view vercel time` first.
- 2026-11-06 19:5x: ALL deploys since Nov 6 00:24 UTC were BLOCKED by Vercel ("commit author doesn't have permission to create deployments" — Hobby team rejects the github-actions bot author). User chose: workflow/bot commits are now authored as the repo owner (dankoff-hub, 345066702+dankoff-hub@users.noreply.github.com) — all workflows updated; use the same identity for agent commits. deploy.yml polls the deployment until READY and fails otherwise. `vercel-status.yml` (dispatch) lists deployment states + reasons.
- 2026-11-06 20:xx: GitHub Actions free minutes (2,000/mo, private repo) were EXHAUSTED — jobs failed instantly ("recent account payments have failed or spending limit"). Cause: publish step waited up to 30 min per run for assets Vercel never served (blocked deploys) + CPU avatar renders (~77 min each). User chose: repo made PUBLIC (unlimited free minutes). Keep runs short: no long polling loops, avatar renders only on explicit request. System-deps step is now bounded (apt hung 13 min on a fresh runner). First carousel car-004 posted to Instagram (channel instagram_carousel), day-004 posted IG+YT after Vercel deploys resumed (READY).
- 2026-11-06 22:xx: Instagram profile applied by owner (name/bio/link/photo; no category). NEW: daily lifestyle photo post → Instagram at slot c (16:00 UTC): `public/photos/photo-NN-<slug>.jpg` (10 owner-supplied photos, 1080x1350), order in `content/photo-queue.json`, hand-written unique captions in `content/photo-captions.json`, poster `scripts/post-photo.mjs` (channel `instagram_photo`, 1/day, caption-ledger guard). Dispatch `daily-tiktok.yml -f channels=photo` posts only the photo. Queue runs out after 10 days — ask owner for more photos (or add to queue + captions).
- 2026-11-06 22:xx: Customer-journey audit (scripts/journey-check.mjs, journey-check.yml dispatch): all pages 200, attribution works (src=ig/free_ig), Stripe success_url confirmed. Fixes shipped: gated /pack (session_id or paid email), PDFs (30-day log, worksheets) served via /pack/file/<log|worksheets>, email capture on /free via /api/subscribe (MailerLite; needs MAILERLITE_API_KEY [+ MAILERLITE_GROUP_ID] as Vercel env — owner adds it; form hides itself until then). OWNER TODO in Stripe dashboard: payment link after-payment redirect → /pack?session_id={CHECKOUT_SESSION_ID}; enable Settings → Emails → Successful payments.
- 2026-11-06 23:xx: Fulfillment per docs.stripe.com/checkout/fulfillment: `app/api/stripe/webhook` (signature-verified; checkout.session.completed / async_payment_succeeded → lib/fulfill.js fulfillCheckout: retrieve w/ line_items, check payment_status, idempotent) + landing page /pack also calls fulfillCheckout. `stripe-setup.yml` (dispatch) sets the payment-link redirect and creates the webhook endpoint via API, storing STRIPE_WEBHOOK_SECRET in Vercel env (never printed). Needs a Stripe key with payment_links + webhook_endpoints write; if STRIPE_API_KEY is read-only the log shows the permission error and the owner must do those two steps in the Dashboard.
- 2026-11-06 late: Receipt emails: lib/fulfill.js sets `receipt_email` on the PaymentIntent at fulfillment (Stripe then emails a receipt even with Dashboard toggle off). Email capture: `/api/subscribe` now stores subscribers in Vercel Blob (private `subscribers/<sha>.json`, free Hobby tier; store `receipts-subscribers` created by `blob-setup.yml`, env BLOB_READ_WRITE_TOKEN auto-linked). MailerLite remains optional (MAILERLITE_API_KEY). Export list: `vercel blob list --prefix subscribers/` (in a workflow).
- Blob store `receipts-subscribers` is PRIVATE (recreated via `blob-setup.yml` with recreate_private). `journey-check.yml` prints subscriber count + hashed ids (never emails); input `prune_test=true` deletes @example.com entries. Verified end-to-end 2026-11-06 22:40 UTC.
- 2026-11-06 23:xx: OPERATION REVENUE SWARM — ABSOLUTE ZERO (user directive, full text in swarm/DIRECTIVE.md). Implemented as `swarm/` + `revenue-swarm.yml` (cron */4h): audit.mjs (ZERO_COST_AUDIT.json, halts on fail) → llm.mjs cascade (GitHub Models → Groq/NVIDIA if keys → Pollinations anon [1 reply/45s/IP, wait+retry] → Ollama on-demand → deterministic template; QUOTA_STATE.json cooldowns + rotation; offline compress()) → hunter.mjs (public Reddit/Bluesky search, rule tiers, ≤6 LLM calls; LEADS.json; replies = High risk, need founder accounts) → creative.mjs (9 concepts/day → content/swarm-scripts.md, which make-video.py now publishes FIRST) → Stripe attribution → REVENUE_SWARM_REPORT.md (+ issue comment "Revenue swarm — daily report") → MEMORY.md (auto-compaction). Not deployed: Cloudflare Workers/Postflare, iFlow/Kiro/Qwen/Puter OAuth — all need founder browser logins; GitHub Actions + Buffer free satisfy the directive's zero-cost audit.
- Swarm findings 2026-11-06: Reddit 403s from GitHub runners (needs founder Reddit app creds); Bluesky works via api.bsky.app (public.api host 403); Mastodon tag timelines + Lemmy search work keyless. GitHub Models (models.github.ai) returns text/plain "OK" for this repo → likely Models not enabled in repo Settings; old Azure host no longer resolves. Pollinations anonymous = gpt-oss-20b reasoning only, 1 reply/45s/IP → +1500 token headroom, reasoning_effort low. Ollama (qwen2.5:0.5b) installs on demand on scheduled runs. Report issue: #21. First swarm creative publishes at the next daily slot (08:00 UTC) via content/swarm-scripts.md priority.
- 2026-11-06 23:5x: Founder shared Google login (tryuderzhi@gmail.com; password was pasted in chat → rotate). Signed up via Google in sandbox browser: **Cloudflare** (account "Tryuderzhi@gmail.com's Account", API token `receipts-swarm-workers` → secrets CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID; Worker `cloudflare/` deployed by `cloudflare-deploy.yml` to https://receipts-swarm.tryuderzhi.workers.dev — cron hunter 5 */2 * * *, KV SWARM_KV, /health /leads /report; repo var SWARM_WORKER_URL → hunter.mjs merges worker leads; audit check card_free_edge_worker), **Groq** (free tier, key `receipts-swarm` → secret GROQ_API_KEY; model list on this account has no llama-3.x → llm.mjs uses GROQ_MODEL || openai/gpt-oss-120b), **NVIDIA NIM** (account + cloud account "receipts-swarm" created; founder verified phone + shared key → secret NVIDIA_API_KEY set 2026-11-06; NIM retired llama-3.x/gpt-oss (410) and most catalog models 404 for this account → llm.mjs uses NVIDIA_MODEL || google/gemma-4-31b-it, verified JSON-mode OK). Postflare skipped (Buffer holds the 3 channels; Postflare needs per-platform OAuth developer apps). Pending from founder: next 10 photos (posts 11–20), NVIDIA OTP, GitHub Models enablement (repo Settings → Models).
- 2026-11-06 permissions recheck: GitHub Models retired (removed from cascade). Reddit: account u/danrossi2026 created via Google login, but app creation is blocked by Reddit's Responsible Builder Policy (explicit approval; written approval for commercial use) → Reddit removed from Actions hunter and Cloudflare worker; founder decides on submitting the API request (Critical tier). Bluesky/Lemmy/Mastodon anonymous read OK; Bluesky replies need an account + app password + per-lead approval. Buffer: 3 channels connected. Full matrix: Project swarm/INFRA.md.
- 2026-11-07 00:xx: (1) Image Forge — Cloudflare Workers AI (free, no card) behind key-gated `POST /image` on the swarm worker (`SWARM_KEY` secret, shared with GitHub); `scripts/make-ai-photo.mjs` generates a 1080px flux-1-schnell image + LLM caption on ODD day-of-year, founder photos on even days (`post-photo.mjs` prefers today's AI entry). Scene bank avoids visible writing (models garble text). Manual check: `image-forge.yml`. Founder photos 11–16 added (presenting, networking, haircut, gym, rain, kitchen-talk). (2) Reddit: API access request submitted via Reddit Help (developer path, read-only search, full disclosure) — watch tryuderzhi@gmail.com; hunters stay off Reddit until approved. (3) Bluesky: @danrossi2026.bsky.social created (profile, avatar, email verified); `BLUESKY_HANDLE` var, `BLUESKY_APP_PASSWORD` + `BLUESKY_PASSWORD` secrets. `swarm/closer.mjs` drafts replies to fresh Tier-1/2 Bluesky leads (relevance re-check, brand-safety check, 1/author, cap 3/day) — DRAFT-ONLY until the founder sets repo var `CLOSER_SEND=1`. (4) 43 free agent skills vendored under `skills/` (see skills/README.md, docs/skills-screen.md); `llm.skillHint()` feeds hook-writer/humanizer into creative and reply-writer/bluesky into closer. (5) `llm.mjs`: reasoning_effort low + token headroom for gpt-oss (Groq JSON-mode 400 fix).
- 2026-11-07 01:00: Closer stage actually wired into `orchestrator.mjs` (hunter → closer → creative) with Bluesky env in `revenue-swarm.yml`; verified run 42320206821: Groq-first cascade (15 calls OK after rotation fix — Groq no longer rotated behind Pollinations), hunter 167 new posts/43 Tier-2 via new Bluesky 48h `since` pass + broader queries, closer evaluated 8 fresh leads and rejected all as non-personal (correct; drafts land in `swarm/CLOSER_LOG.json`). `llm.mjs` now stores `last_error` per provider in QUOTA_STATE for log-free diagnosis.
- 2026-11-07 01:20: FOUNDER AUTHORIZED unattended Closer sending ("40/day. do posts and replies on other platforms as well. target is revenue."). Repo vars `CLOSER_SEND=1`, `CLOSER_DAILY_CAP=40`; swarm cron now every 2h (`30 */2`); Closer paced ≤8/cycle, 1 reply/author, skips sellers/apps/politics/our own posts, no self-intro replies. **Mastodon** account @danrossi2026@mastodon.social created (profile + avatar set; secrets `MASTODON_PASSWORD`, `MASTODON_TOKEN` app "receipts-swarm", scopes read:*, write:accounts/statuses/media). Closer replies on Mastodon too (`in_reply_to_id`, @mention). New `scripts/post-social.mjs` posts originals to Bluesky + Mastodon from `daily-tiktok.yml`: slot a text post (from newest swarm concept, hash-ledgered), slot c today's Instagram photo + caption + /free?src=bsky|masto link. Creative got a brand guard (ON/OFF regex; off-brand creator-economy scripts purged from the queue). `bluesky-admin.yml` deletes one of OUR posts (used once to remove a self-reply caused by the hunter picking up our own reply — now excluded). llm.mjs: Groq json-word guard, NVIDIA 120s timeout. Lemmy not yet (instances require application approval); Reddit still awaiting API approval.
- 2026-11-07 01:50: Verified end-to-end: Groq creative on-brand after fixing a truncated system prompt (product brief now first; `compress(system,1400)`); brand guard logs rejections; `swarm/CYCLE_LOG.txt` (committed, last 600 lines) replaces Actions-log access for diagnosis. `social-post.yml` manual workflow; first Bluesky original post + Mastodon post live. Closer sent 2 Bluesky replies in its first authorized cycle (one weak/off-topic → relevance prompt tightened, promo/self-intro filters added). Next: Lemmy account (instances need application approval), Reddit approval email, watch CLOSER_LOG quality daily.

## 2026-11-07 02:xx — Skool: ToS gate + human-published queue
- Skool bans bots/automation/scraping (help.skool.com/article/179-platform-policy; Terms §4) and has no public API → **Critical tier, never automated**. No workarounds.
- `swarm/skool.mjs` (orchestrator stage `skool`, after creative): once per day drafts 1 community post + 3 comment templates aimed at 30-day-challenge/habit communities → `content/skool-queue.md` (hash ledger `<!-- h:... -->`, never repeats). Human pastes by hand. Also appended to the daily brief issue.
- Playbook: `docs/skool-playbook.md` (5 free communities, routine: 1 post/week/community, comments daily, no links, tracker in bio, `?src=skool`).
- Owned community = $9+/mo with card → founder decision only.

## 2026-11-07 03:xx — Video variant experiment (voice / music / background)
- Question: do voice, music, and footage backgrounds (city/nature/other) beat the old recipe (voice, no music, gradient)? Our own data could not answer (every video had the same recipe; 0–7 views). Published evidence: speech in first 3s +25% 10s-retention vs music-only (Emplifi, 10k Reels); quiet music bed (−12…−16 dB) expected on Reels; b-roll + voiceover > static.
- Applied: `scripts/render-v2.py` v3 — variants `{voice:on|off, music:on|off, bg:gradient|city|nature|other}`; footage + music from Mixkit (free licence, no key, no account) via `content/broll-pool.json` / `content/music-pool.json` (refreshed weekly by `scripts/broll-scout.mjs` in content-forge.yml). Voice now starts at 1.0s. Voice-off videos always get music + sentence cards.
- `scripts/make-video.py` picks the variant per video from `content/variant-policy.json` weights (priors: voice 85/15, music 70/30, bg city 30 / nature 30 / gradient 25 / other 15) and writes `variant/broll/music` into the sidecar JSON. Override with env `VIDEO_VARIANT='{"bg":"city"}'`.
- `scripts/post-metrics.mjs` (audience-watch, daily) computes relative views per level (views / channel median, pooled IG+YT+TT), and once every level of a factor has ≥6 settled posts, re-weights (50% old, 50% evidence, floor 10%) — self-applying. Evidence + changes in `strategy-brief.variant_experiment` and `variant-policy.history`.
- Pexels API key issuance is paused; Pixabay signup blocks non-human form fill — both skipped. Mixkit needs neither.
- 03:5x — Caption pacing fixed for humans (user: "text is moving too rapidly"): phrase cards (3–5 words, split at punctuation into balanced chunks, ≤24 chars) shown whole instead of word-by-word pops; min hold 1.1s; cards never overlap (next waits); hook card lasts 1.4–2.4s by length (speech still starts inside first 3s); voice-off sentence cards at 2.0 words/s, ≥1.8s each. Voice rate/pitch unchanged (+10%, −5Hz Brian).
- 04:0x — Carousel pacing matched to the videos (`scripts/make-carousel.py`): one complete thought per slide, ≤11 words; sentences longer than that split at the clause break nearest the middle (comma/dash/semicolon, "…" continuation) else balanced halves; fragments ≤3 words merge into the next thought; short scripts pull body sentences; up to 6 points (8 slides max); min headline font 56px. Ledgers unchanged.

## 2026-11-07 — Followers first
- `swarm/community.mjs` (stage after closer): follow-back + mention replies + capped targeted follows on Bluesky/Mastodon. Caps via repo vars `COMMUNITY_REPLY_CAP` (20) / `FOLLOW_DAILY_CAP` (20). Log `swarm/COMMUNITY_LOG.json`. Mastodon token now has `write:follows`.
- Follow CTA variant (`cta: follow|template`, weights .6/.4) in `content/variant-policy.json`; spoken "Follow for day N+1" + gold FOLLOW end card in render-v2; captions/carousels carry a follow line.
- audience-watch tracks `bluesky_followers`, `mastodon_followers`, `followers_total_known` (+d7).
- post-social slots b/d now push the newest rendered video to Mastodon (`/api/v2/media`, polled). Bluesky video not implemented.
- Captions never run into the 2 s end card (clamped in render-v2).

## 2026-11-07 — Customer journey (tappable path rule)
- Rule: a URL on screen / in an IG or TikTok caption is NOT tappable. Every CTA names only what the thumb can hit on that platform: IG "link in bio"; TikTok "link in my profile (tap Instagram)" (personal TikTok <1k followers has no website field — founder must add Instagram + YouTube links to the TikTok profile, or switch to Business + verification); YouTube "link in the description" + full URL in every caption; Bluesky/Mastodon real links in every post (facets) and in bios. Spoken CTA in videos: "link in my profile". Carousel CTA slide the same. Short alias `receiptspack.vercel.app` (added via alias-setup.yml; old receipts-blond keeps working) is the typed fallback.
- /free: headline message-matches `?src=` (ig/tt/yt/bsky/masto), Step 1-of-5 progress bar + "I wrote my receipt" tick (endowed progress, Nunes & Drèze 2006; foot-in-the-door, Freedman & Fraser 1966), instant printable `/free/sheet` (no email gate), honest reminder copy (API returns `sends:false` until an email provider exists — nothing is emailed yet), "what happens after you pay", public-proof links. /bio: same trust line + watch-me links.
- Evidence from journey-check: 8 Stripe checkout sessions opened (Nov 3–6), 0 paid; 1 subscriber stored. Next lever: a free email sender (Brevo/MailerLite, no card) so the day-1 reminder is real.
- `content/profile.json` + `scripts/profile-sync.mjs` (profile-sync.yml on change) keep Bluesky/Mastodon bios pointing at the short link.

## 2026-11-07 — Day-1 reminder email (Mailjet), privacy page, founder checklist
- Email provider: **Mailjet** free plan (6,000/mo, 200/day, no card, no phone) — account tryuderzhi@gmail.com, email verified, business-verification ticket **#4331805** open (sending + secret-key generation unlock when Mailjet approves; check inbox for the ticket reply). Brevo was tried first: free plan active but API-key creation demands SMS phone verification (founder-only) → parked.
- Code: `lib/mail.js` (Mailjet v3.1 send, `MAIL_FROM` default tryuderzhi@gmail.com, `POSTAL` footer = Tealstone Consulting Ltd, 61 Bridge Street, Kington, Herefordshire, HR5 3DJ — Companies House 15180506, founder-approved); `app/api/reminders/run` (POST, header `x-cron-key` = `CRON_SECRET`; reads private Blob `subscribers/`, emails 20h+ old un-reminded records, marks `remindedAt`, hourly cap `REMINDER_HOURLY_CAP`=25); `day1-reminder.yml` hourly at :15; `deploy.yml` copies `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `CRON_SECRET` GitHub secrets into Vercel prod env once. `/api/subscribe` returns `sends:true` only when Mailjet keys exist → Capture shows "done" copy; until then "stored" copy (honest).
- **Activation steps when Mailjet approves:** API Key Management → Generate Secret Key → `gh secret set MAILJET_API_KEY` / `MAILJET_SECRET_KEY` (pipe, never print) → dispatch deploy.yml → dispatch day1-reminder.yml, expect `{"ok":true,...}`. `CRON_SECRET` already set.
- `/privacy` page (operator, data, rights, Stripe/Vercel/Mailjet) linked from / and /free; URL given to Mailjet as privacy policy.
- `docs/founder-checklist.md`: founder-only steps (IG bio link, TikTok Instagram/YouTube buttons + Business switch, YouTube channel link + pinned comments). Instagram and YouTube live on the founder's own logins, not the swarm Google account (Studio returns "no permission").
- No guarantee/refund language anywhere (founder decision 2026-11-07) — reminder email copy follows it.

## 2026-11-07 — Instagram web access
- Web login for @danrossi2026 works but every new login emails a 6-digit code to the founder's own inbox (d*****f@gmail.com), not tryuderzhi — founder must relay it. Bio text is editable on web; **link field is mobile-app only** (web edit endpoint `/api/v1/web/accounts/edit/` returns ok but ignores `external_url`; mobile-app endpoints via web cookies invalidate the session → do not retry, risk of checkpoint). Display-name change blocked by 14-day lock. Current link /bio?src=ig keeps attribution and leads to /free in one tap. Founder sets the link in-app (docs/founder-checklist.md). Founder was asked to rotate the IG password (pasted in chat).

## 2026-11-07 — YouTube + TikTok direct access; TikTok repeat bug
- Google login (tryuderzhi) works for YouTube Studio directly; the real channel is **UC-S1lywjoVwp0HPUv8s4TKA / @DanRosa-u5v** (UC_Io87… in old notes was wrong → audience-config fixed). Links (free → IG → $29), description with URLs, and a creator comment on all 10 Shorts are live; pinning blocked for new channels.
- TikTok web login = Google prompt on founder's phone + email code to tryuderzhi inbox. Profile photo + bio set. Business switch / website link / IG+YT buttons are app-only → founder checklist.
- **Bug fixed:** `scripts/publish-buffer.mjs` referenced an undefined `file` when writing content/post-log.json → TikTok posts were sent but never logged → `publish-pending.mjs` re-posted the same oldest video (avatar-01-intro) every slot (5 copies on TikTok, 4 deleted). Fix: define `file`, fail loudly if the ledger write fails, same-day repeat guard in publish-pending, ledger backfilled. TikTok now gets the pending unique videos at 2/day.
- Mailjet ticket #4331805: support asked for trigger details + sample; replied 2026-11-07 15:45 from tryuderzhi (transactional, single Day-1 reminder, <20/day, sample included). Still waiting for approval before generating the secret key.
- Verified 2026-11-07 15:45Z: post-fix run sent day-002.mp4 to TikTok and logged it (first unique TikTok video after the repeat bug). /bio and /free YouTube links fixed to @DanRosa-u5v.

## 2026-11-07 — First comment with link; site redesign
- **First-comment rule:** every post on a platform without a tappable link carries ONE creator comment with the typeable URL `receiptspack.vercel.app/free`. Instagram: native Buffer `firstComment` in cross-post-instagram / post-photo / post-carousel (wording bank `scripts/first-comment.mjs`). TikTok: Buffer has no first-comment field → posted via the logged-in browser; a daily Perplexity automation ("TikTok first comment with link", 13:15 London, runs in the source conversation) comments on every new video and logs to `content/first-comments.json`. YouTube already has creator comments + description links.
- TikTok captions/end card/spoken CTA now say "free Step 1 at receiptspack.vercel.app/free (also in the first comment)" instead of "tap Instagram"; make-video.py end card = "Free Step 1 → first comment".
- **Redesign:** black theme dropped. Tokens in `app/theme.js`: paper `#F6F1E8`, ink `#17161A`, deep-green CTA `#0F4C3A`, amber progress `#C77A00`; fonts Fraunces (headings) + Inter (body) via next/font/google. All pages use the shared tokens; /pricing rebuilt as a real price card. Rationale: positive-polarity reading performance (Piepenbrock et al. 2013) and a single high-contrast CTA colour.

## 2026-11-07 — End-to-end audit (bugs, journey, clickability)
- **Mobile QA (Playwright, iPhone 13) found & fixed:** email forms overflowed cards on narrow screens (`form` grid token), printable-sheet link below 44px tap target, footer disclaimer contrast 3.11:1 → ≥4.5:1, social links 20px → 44px, 11px eyebrows → 12px (incl. `/free/sheet`). Production re-check 16:56Z: **No issues**.
- **Pipeline hardening:** `scripts/git-push-safe.sh` in daily-tiktok, avatar-render, audience-watch, content-forge, growth-swarm, revenue-swarm, virality-swarm (fixes the weekly avatar-render "Commit video" failures and the Nov-3 daily-brief push failures). `journey-check.yml` gained a daily cron (07:30 UTC) + the mobile QA step. `day1-reminder.yml` treats Mailjet 503 as a clean skip instead of a red run.
- **Scheduled swarms status:** growth, virality, guerrilla, revenue, audience-watch, daily-tiktok, journey-check all green. Supply: 13 unique videos on disk; post-log Nov 7 — TikTok 4 sent / 9 pending (cap 2/day, backlog is intentional), Instagram 11 / 2 pending, YouTube 11 / 2 pending; 0 duplicate captions, 0 repeated videos.
- **Stripe checkout friction (Critical — founder decision, not changed):** the payment link shows a required dropdown "Immediate access (see note below) — Select…", a checkbox "I agree and accept the loss of my cancellation right", and adaptive currency "£22.59 | $29.00 (includes 4% conversion fee)". Legal waiver text stays; founder may simplify in the Stripe dashboard (payment link → custom fields / adaptive pricing).
- Debug tip: `gh run view --log` hits a 403 rate-limit path; use `gh api repos/dankoff-hub/receipts/actions/runs/<id>/attempts/1/logs > x.zip` and read it with Python `zipfile`.

## 2026-11-07 — Partner (affiliate) programme = lever 2
- **Offer:** 50% of each completed sale ($14.50 on $29; founder-confirmed 2026-11-07), founding rate locked 12 months for joins before 2027-01-31; 60-day first-party attribution, last partner link wins and beats organic src; monthly payout by the 5th via PayPal/Wise, $30 minimum, 14-day hold; free pack for partners; disclosure required; no earnings/therapy/refund language. Config `content/partner-program.json`; rationale + outreach templates + payout runbook `docs/partner-offer.md`; public pages `/partners`, `/partners/terms`; applications → private Blob `partners/applications/` via `/api/partners` (503 until BLOB token present — it is on prod).
- **Mechanics:** `/p/<code>` → cookie `rp_ref` (60d) → `/free?src=aff_<code>-p`; `lib/attrib.js withRef()` folds the code into every checkout link on `/`, `/bio`, `/free`, `/pricing` (`client_reference_id=aff_<code>-<src>` or `free_aff_<code>-<src>`). Verified in prod 17:22Z.
- **Payback channel:** ledger is automated and read-only; **paying is Critical** — founder sends PayPal (goods & services: free for sender in UK; international personal transfers capped at £2.99) or Wise batch, ticks the statement issue. Partner payout details never enter the public repo.
- **Known gap:** restricted Stripe key lacks "Charges and Refunds: read" → ledger cannot auto-remove refunds/disputes (`reversals_checked:false`); founder either grants charge_read on the key or checks the dashboard before paying.
- **Prospects seeded (public data):** 26 YouTube micro-channels + 12 newsletters researched 2026-11-07; 21 scored ≥40 = outreach-ready. Top: @discipline7q (22k subs, median 116k views), @officialconnerspencer, @Myelia_irl, @Forged4Future (comeback stories), @KeyToDiscipline_ (57k, median 12k), @MissionSideHustle (104k + beehiiv), Xtreme Motivation (10k+ men newsletter), 7% Better, The Improvement Journal, The Soft Stoic (email on about page), Own Your Ambition. First outreach batch needs founder approval (template + sender); then High tier, cap 10/day, log status in `content/partner-prospects.json`.

### Sender + commission (approved 17:26 London, 2026-11-07)
- Commission **50% = $14.50** everywhere (`content/partner-program.json` `commission_pct`, `/partners`, `/partners/terms`, ledger, `docs/partner-offer.md`).
- The swarm sends outreach itself across platforms (Instagram DM, Substack Message as ops account "Dan Rossi", Gmail, TikTok comment, YouTube comment — route table in `docs/partner-sender.md`); 4 windows/day, ≤5 each, each with inbox sweep + replies (automations `1850a1e1…` 09:40, `b36e4f52…` 13:20, `93141e5d…` 16:50, `0c335a9a…` 20:30 London, source_thread because the browser logins live there); cap 20/day total + 8/platform (`cap_per_platform` in the log); one unique text per prospect (`scripts/partner-drafts.mjs`, Groq via partner-swarm.yml; `chat()` returns `{provider,text}`); hard cap 20/day via `scripts/partner-log.mjs` + `content/partner-outreach-log.json`; runbook `docs/partner-sender.md`.
- Partner pack copy: `/pack?partner=<code>&k=<16 hex>`; `k = HMAC-SHA256(PARTNER_PACK_SECRET, "partner:"+code)[:16]` (`lib/pack.js partnerKey`, `scripts/partner-grant.mjs`). Secret: GitHub secret `PARTNER_PACK_SECRET` (synced to Vercel by deploy.yml) + sandbox `~/.config/receipts/partner.key`. Issued only after a "yes", never in cold outreach.
- Day 1 (2026-11-07): DMs to @Myelia_irl (13.2k IG), @Forged4Future, @officialconnerspencer; email to The Soft Stoic Letter. `@discipline7q` IG link is dead (`ig_dead: true`). Addresses are never stored in the public repo.

## 2026-11-07 — Operating core + authority ledger
- `swarm/CORE.md` (≈500 tokens) is the per-run operating prompt: $50k/2027-01-31 operating target with pace maths; £300k/30d kept as north star only. `swarm/AUTHORITY.md` = approvals/caps (A1–A12) and founder-only list (F1–F7); agents never re-ask approved items and never execute founder-only ones. `swarm/reference/MASTER_PROMPT.md` = the user's long master prompt, reconciled ([R] marks): channels widened to all live platforms, partner outreach within caps is approved outreach, zero-cost schedulers approved, USD reporting. `coreHint()` in `swarm/llm.mjs` is opt-in (not auto-injected). Audit check `core_prompt_budget` keeps CORE.md ≤500 soft / 700 hard est. tokens.

## 2026-11-07 — TikTok upgraded to Business account
- Confirmed on web ("Business tools unlocked"). Web cannot save bio/Website or set auto-messages (update/profile → 200, empty body, no change — tested twice); these are founder phone-app steps, see docs/founder-checklist.md → TikTok. Ready-to-paste text: `content/profile.json` (`tiktok_bio*`, `tiktok_website`, `tiktok_welcome_message`, `tiktok_keyword_replies`, `tiktok_suggested_questions`). `content/audience-config.json`: `tiktok_account_type: business`, `tiktok_bio_link_live: false` → make-video.py switches the TikTok CTA to "tap the link in my bio" once true; first-comment link stays on (standing rule). Business accounts only get Commercial Music Library in-app sounds — irrelevant, our files carry their own audio. Business Center (ads ecosystem) deliberately not created: separate TikTok-for-Business registration, no paid ads, founder-only account creation.

## 2026-11-07 — Stripe payment link simplified (founder-approved in chat)
- `scripts/stripe-setup.mjs` steps 1b/1c (idempotent): cleared `custom_fields` (the "Immediate access" dropdown that doubled as the withdrawal-waiver consent), `submit_type: pay`, submit note; then `consent_collection[terms_of_service]=required` with `custom_text[terms_of_service_acceptance]` = waiver wording → one checkbox replaces the dropdown. Lesson: on this link the dropdown WAS the legal consent control — never remove a consent mechanism without restoring one in the same run. Adaptive Pricing has no Payment Link API field (Dashboard only). Journey check after change: all 200, mobile QA no issues, checkout = email + method + 1 checkbox + Pay.
- 2026-11-07 evening, end-to-end channel check (all platforms, off-window test posts): Buffer free plan rejects Instagram `firstComment` ("requires a paid plan") — all IG lanes failed for one slot; fix = link line appended to the caption (`withLinkLine` in scripts/first-comment.mjs), never pass firstComment. `publish-pending` repeat guard now skips the video, not the channel. `git-push-safe.sh` uses `rebase --autostash` (a ledger push died on unstaged files and silently lost an IG post-log entry; restored by hand from the run log). TikTok first comments are posted by the 13:15 automation; for posts published after that window, add the comment manually or the caption's "(first comment)" promise is empty.
- 2026-11-07 post-quality pass (founder "execute" on the 10 improvements): renderer — hook card ≤1.3s (was up to 2.4s), voice starts inside the first second, caption chunks never cross a clause boundary, end card 1s (was 2s), ONE on-screen ask per video (follow OR template, never both). Captions — CTA bank has no price (the page sells), no auto "follow" line, YT title has no "Day N:" prefix. Domain — everything now points at receiptspack.vercel.app (old receipts-blond kept only as a working alias). First comments now carry a question + link (firstCommentWithQuestion), and the 13:15 TikTok automation was updated to use it and to answer replies. post-social prompts are on-niche only (discipline/careers/proof) and demand a concrete receipt, not a feeling. Outreach: first message never contains a link (Substack suspension lesson) — drafts.dm_opener / dm_followup split.
- 2026-11-07 founder "do all three": content spine = the 30-day run (content/daily-run-scripts.md, 15 on-person scripts; make-video.py prefers it). Visuals = founder persona photos (assets/persona/, 10 photos, day-rotated ken-burns background in render-v2) — no more flat gradients as the default. Cadence = 2 video slots/day (09:00 + 19:00 UTC; slots b/d removed; carousel moved to slot a, photo stays slot c). SadTalker avatar lane exists but is paused: 256px CPU renders look uncanny (static stare, windowboxed, seam glitch) — do not use it for "high-resolution human-like" content without a GPU runner. Daily performance review: scripts/post-metrics.mjs writes content/performance-review.md (top/bottom yesterday, retention, tomorrow's change) and audience-watch.yml commits + prints it.
- 2026-11-07 (evening, founder "do all three + review performance daily"): render-v2 verified frame-by-frame on day-1 render — hook card 0-1.3s, karaoke phrases never cross clause ends, hook words never repeated after the card, FOLLOW end card is the last thing, persona photo (bills.jpg) as ken-burns background, no overlap. Variant weights: persona 90%, voice 95% (voice-off + music was the uncanny look). make-video: spine day = argv[3] (Nov 8 = day 1 → script 1, in order). Workflow: D label from Nov-8 epoch; files still from Nov-3 epoch (unique names). SadTalker avatar lane NOT used for the spine — 256px CPU renders are uncanny (static stare, windowbox, seam glitch); needs a GPU runner before "high-resolution human-like".
