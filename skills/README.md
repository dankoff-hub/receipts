# Vendored agent skills (SKILL.md format)

Copied 2026-11-07 from open-source repos after a license/zero-cost screen (see `docs/skills-screen.md`). Each folder is a standard Agent Skill (`SKILL.md` + optional `scripts/`, `references/`); load one by reading its `SKILL.md` when the task matches. All are free, need no paid service, no card.

| Prefix | Source | License |
|---|---|---|
| `ffmpeg-skill` | https://github.com/kajisho5/ffmpeg-skill | MIT |
| `social-*` | https://github.com/social-media-skills/skills | MIT |
| `marketing-*` | https://github.com/coreyhaines31/marketingskills | MIT |
| `gh-*` | https://github.com/github/awesome-copilot | MIT |
| `cf-workers-best-practices` | https://github.com/cloudflare/skills | Apache-2.0 |
| `stripe-best-practices` | https://github.com/stripe/ai | MIT |
| `humanizer` | https://github.com/blader/humanizer | MIT |
| `openclaudia-*` | https://github.com/OpenClaudia/openclaudia-skills | MIT |
| `pm-*` | https://github.com/phuryn/pm-skills | MIT |

Where the swarm uses them: `social-hook-writer` / `social-reels-script` / `marketing-copywriting` / `humanizer` → Creative Provocateur prompts; `social-reply-and-comment-writer` / `openclaudia-bluesky` / `social-reddit-marketing` → Closer drafts; `ffmpeg-skill` → `scripts/make-video.py` captions/loudness/platform checks; `gh-github-actions-*` → workflow hygiene; `cf-workers-best-practices` → `cloudflare/`; `stripe-best-practices` → checkout/webhook; `marketing-cro` / `openclaudia-page-cro` → landing page; `pm-ab-test-analysis` → CTA/hook test reads.
