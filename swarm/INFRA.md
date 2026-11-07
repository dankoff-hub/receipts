# Swarm infrastructure (zero-cost) — as of 2026-11-06

| Component | Provider / plan | Where | Status |
|---|---|---|---|
| Orchestrator (audit→hunter→creative→attribution→report) | GitHub Actions, public repo (free minutes) | `.github/workflows/revenue-swarm.yml`, cron `30 */4 * * *` | live |
| Edge hunter (cron scan of Bluesky/Lemmy/Mastodon, KV state; Reddit excluded) | Cloudflare Workers Free + KV Free | `cloudflare/`, deployed by `cloudflare-deploy.yml` → https://receipts-swarm.tryuderzhi.workers.dev (`/health`, `/leads`, `/report`); cron `5 */2 * * *` | live; Actions merges `/leads` via repo var `SWARM_WORKER_URL` |
| LLM cascade | Groq free (`GROQ_API_KEY`, model `openai/gpt-oss-120b`) → NVIDIA NIM (`NVIDIA_API_KEY`, model `google/gemma-4-31b-it`) → Pollinations anonymous → Ollama on-demand → template | `swarm/llm.mjs`, `swarm/QUOTA_STATE.json` | Groq + NVIDIA live |
| Image Forge (AI photo every other day) | Cloudflare Workers AI Free (10k neurons/day) via worker `POST /image` (key-gated) | `scripts/make-ai-photo.mjs`, `image-forge.yml` | live (flux-1-schnell 1024→1080px) |
| Closer (Bluesky replies) | Bluesky account @danrossi2026.bsky.social, app password | `swarm/closer.mjs` | SENDING (founder-authorized 2026-11-07, cap 40/day, paced) on Bluesky + Mastodon |
| Mastodon posts/replies | mastodon.social account @danrossi2026 + app token (`MASTODON_TOKEN`) | `scripts/post-social.mjs`, `swarm/closer.mjs` | live |
| Bluesky original posts | app password | `scripts/post-social.mjs` (slot a text, slot c photo) | live |
| Publishing | Buffer Free (3 channels: TikTok, Instagram, YouTube) | `daily-tiktok.yml` slots 08/12/16/20 UTC | live |
| Site + checkout | Vercel Hobby + Stripe (fees on sales only) | https://receiptspack.vercel.app, payment link → `/pack?session_id=…` | live |
| Postflare | — | skipped: Buffer already holds all channels; Postflare needs per-platform OAuth developer apps | n/a |

Accounts created with the founder's Google login (tryuderzhi@gmail.com): Cloudflare, Groq, NVIDIA (key set 2026-11-06), Reddit u/danrossi2026 (API app blocked — see below). Secrets live only in GitHub Actions secrets; never in files or chat.

## Permissions audit — 2026-11-06

| Source / action | Permission needed | Status |
|---|---|---|
| Reddit search (lead research) | Reddit Data API approval under the Responsible Builder Policy; commercial use needs written approval | **Blocked** — app creation at reddit.com/prefs/apps refused; founder decides whether to submit Reddit's access request. Excluded from both hunters; no workarounds. |
| Bluesky public search | none (anonymous `api.bsky.app`) | OK |
| Bluesky replies (Closer) | Account + app password (set) | Account live; Closer sends (CLOSER_SEND=1, CLOSER_DAILY_CAP=40, founder-authorized) |
| Lemmy / Mastodon search | none | OK |
| Groq, NVIDIA NIM | API keys (set) | OK |
| Pollinations | none; optional free token (auth.pollinations.ai, GitHub login) raises rate limits | OK anonymous |
| GitHub Models | — | retired 2026-07-30; removed |
| Buffer (TikTok/Instagram/YouTube) | channel connections | all 3 connected, posts "sent" |
| Meta / TikTok / YouTube direct APIs | developer apps + review | not needed (Buffer) |
| Stripe, Vercel, Cloudflare | tokens (set) | OK |

| Skool | Not automatable (ToS) — human-published queue via `swarm/skool.mjs` → `content/skool-queue.md`; playbook `SKOOL_PLAYBOOK.md` | free | 2026-11-07 |

| Mixkit (b-roll + music) | Free licence, no key/account; pools refreshed weekly by `scripts/broll-scout.mjs`; used by video variant experiment | free | 2026-11-07 |
| Pexels API / Pixabay API | Not used: Pexels key issuance paused; Pixabay signup rejects non-human form fill | — | 2026-11-07 |

| Mastodon token | scopes read write:follows write:statuses write:media write:accounts (app receipts-swarm-community, 2026-11-07) | GitHub secret MASTODON_TOKEN | free |

| Short alias | receiptspack.vercel.app → receipts project (alias-setup.yml) | Vercel | free |
| Day-1 reminder email | Mailjet Free (6,000/mo, 200/day, no card, no phone) — account tryuderzhi@gmail.com; business-verification ticket #4331805 pending | `lib/mail.js`, `app/api/reminders/run` (x-cron-key), `day1-reminder.yml` hourly; Vercel env MAILJET_API_KEY/MAILJET_SECRET_KEY/CRON_SECRET via deploy.yml; `/privacy` | code live; sends unlock on Mailjet approval (then generate secret key → gh secrets → redeploy). Brevo fallback blocked on SMS verification (founder) |
