# Receipts Pack — GitHub Agent-Skills Screen

Date: 2026-11-07. Scope: read-only web research of SKILL.md-style "Agent Skills" on GitHub that could be added to the Receipts Pack publishing/growth swarm (GitHub Actions + Cloudflare Workers Free + Buffer Free; LLMs via Groq / NVIDIA NIM / Pollinations free tiers). Hard filters applied: must be free with no credit card, no paid ads, no X/Twitter. Every repo below was fetched directly (GitHub page, raw SKILL.md, or GitHub API metadata) on the date above.

---

## 1. How skills are installed and consumed

**The format (Agent Skills open standard).** A skill is a directory containing at minimum a `SKILL.md` with YAML frontmatter (`name`, `description` required; `license`, `compatibility`, `metadata`, `allowed-tools` optional) followed by Markdown instructions; optional sibling folders are `scripts/` (executable code), `references/` (docs loaded on demand) and `assets/` (templates/resources). `name` must be lowercase-hyphenated and match the directory name. Source: [agentskills.io specification](https://agentskills.io/specification).

**Reference implementation.** Anthropic's public repo `anthropics/skills` follows exactly this layout; e.g. `skills/skill-creator/` contains `SKILL.md`, `scripts/`, `references/`, `assets/`, `agents/`, `eval-viewer/` and a per-skill `LICENSE.txt` (Apache License). Source: [anthropics/skills — skills/ index](https://github.com/anthropics/skills/tree/main/skills) and per-skill directory listing via GitHub API (`skills/skill-creator/LICENSE.txt` begins "Apache License").

**Install mechanics in practice (no accounts needed):**
- Copy the skill folder into the agent's skills directory (Claude Code: `~/.claude/skills/<name>/` or `.claude/skills/<name>/` in the repo; Codex/Cursor/etc. have equivalents). Most repos recommend the `npx skills add <owner>/<repo> [--skill a b]` CLI, which just copies folders — e.g. `npx skills add coreyhaines31/marketingskills --skill cro copywriting` ([marketingskills README](https://github.com/coreyhaines31/marketingskills)).
- Some repos publish **Perplexity-specific ZIPs** per skill in their GitHub Releases (e.g. `ab-testing-perplexity.zip`, `analytics-perplexity.zip` among 162 assets in `coreyhaines31/marketingskills` v2.14.2 — verified via GitHub API `releases/latest`). That makes them directly importable into Perplexity Computer as custom skills.
- Skills are "progressive disclosure": only `name`+`description` are loaded at startup; the body and `references/` load when triggered. So adding 10–12 skills has negligible context cost until used.
- For this project, the natural home is a `skills/` folder in `github.com/dankoff-hub/receipts` (git submodule or vendored copy) so the GitHub Actions swarm and Perplexity Computer sessions read the same files.

---

## 2. Candidate table (verified)

| # | Skill (repo) | URL (verified) | What it does (one line) | Why it helps Receipts Pack | License | Paid service needed? |
|---|---|---|---|---|---|---|
| 1 | **ffmpeg-skill** (kajisho5) | https://github.com/kajisho5/ffmpeg-skill | 42 local FFmpeg tools (cut, join, 9:16 reframe, speed, captions, overlays, silence removal, loudness, platform exports/checks) with a machine-readable contract, Python stdlib only. | Core of a zero-cost short-form pipeline inside GitHub Actions: `crop.py`/`fit.py` for vertical, `caption.py` for burned-in captions, `loudness.py`/`export.py` for TikTok/IG/YT-compliant files. Frontmatter: "Needs FFmpeg 6.1+ and Python 3.10+; stdlib only, no cloud." | MIT (API + badge) | **No.** Optional local transcription via faster-whisper/whisper.cpp if you want ASR captions; otherwise runs offline. 4.6k stars, pushed 2026-11-06. |
| 2 | **marketingskills** (coreyhaines31) — pick `copywriting`, `cro`, `ab-testing`, `social`, `video`, `analytics`, `attribution`, `launch`, `pricing`, `offers`, `community-marketing`, `image` | https://github.com/coreyhaines31/marketingskills | 50+ marketing skills (CRO, copywriting, SEO, analytics, growth engineering) for any Agent-Skills-compatible agent; `product-marketing` is the foundation skill others read first. | Directly covers copywriting/CTA testing, landing-page CRO, A/B test setup, UTM/analytics, attribution, pricing/offers for a $29 product, and the `video` skill explicitly covers "clipping long-form content, captions, effects, platform-specific styling, and batch production" for TikTok/Reels/Shorts. Ships Perplexity ZIPs per skill. | MIT ("Use these however you want") | **No.** Knowledge-only; references free tools. |
| 3 | **social-media-skills/skills** — pick `tiktok-growth`, `instagram-growth`, `youtube-shorts`, `hook-writer`, `tiktok-script`, `reels-script`, `short-form-video-script`, `captions-and-clipping`, `platform-specs-and-validation`, `viral-reverse-engineering`, `experimentation-and-ab-testing`, `link-in-bio-and-traffic`, `image-prompt`, `reddit-marketing` | https://github.com/social-media-skills/skills | 106 platform-specific social skills (strategy, writing, video, design, growth). | The most targeted set for the three channels in the swarm: `tiktok-growth` encodes the "completion rate ~70%+, rewatch, search" model and routes to `hook-writer`/`tiktok-script`; `reddit-marketing` is explicitly "advisory-only… never automates, never uses alts or vote manipulation"; `image-prompt` is model-agnostic prompt craft (usable with Pollinations). | MIT (repo + per-skill frontmatter) | **No.** Skills mention the sponsor's scheduler "WoopSocial" as an optional publisher; nothing requires it (Buffer Free fits the same slot). Skip the `x-growth`, `ugc-and-influencer`, paid-tool mini-skills (opus-clip, heygen, veo-3, etc.). |
| 4 | **remotion-dev/skills** — `remotion-best-practices`, `remotion-create`, `remotion-markup`, `remotion-render`, `remotion-captions` | https://github.com/remotion-dev/skills | Official Remotion Agent Skills: best practices for compositions, animations, typography, media, rendering, and captions (JSON `Caption` type from `@remotion/captions`, transcribe/display/import-SRT guides). | Programmatic branded video templates (hook card → receipt animation → CTA) rendered in CI; the captions skill gives word-timed caption rendering for sound-off viewing. | Repo has no LICENSE file (API: none). Remotion itself: Free License "for individuals and companies of up to 3 people… unlimited commercial use" ([remotion.dev/license](https://www.remotion.dev/license)). | **No** for a solo founder. Flag: company license required if the team grows past 3 people. |
| 5 | **cloudflare/skills** — `cloudflare`, `workers-best-practices`, `durable-objects`, `agents-sdk` (as needed) | https://github.com/cloudflare/skills | Official Cloudflare skills for Workers, Agents SDK and the developer platform; `workers-best-practices` folder = `SKILL.md` + `references/`. | The swarm already runs on Workers Free; these keep generated Worker code idiomatic (bindings, wrangler config, limits) and reduce debugging cycles. | Apache-2.0 | **No.** Workers Free tier is sufficient; no card. |
| 6 | **stripe/ai — `stripe-best-practices`** (and `stripe-docs`) | https://github.com/stripe/ai/tree/main/providers/agent-plugins/plugin/skills | Official Stripe skill: Checkout Sessions vs PaymentIntents, sandboxes/test mode, tax, webhooks, API-key permissions, migration from deprecated APIs. | Hardens the $29 Checkout + webhook flow (idempotency, key scoping, test-mode discipline) without hiring a payments reviewer. Also installable via `npx skills add https://docs.stripe.com`. | MIT (stripe/ai repo README) | **No.** Stripe account is free; fees are per-transaction only. |
| 7 | **github/awesome-copilot — `github-actions-efficiency`, `github-actions-hardening`, `diagnose-ci-gate`** | https://github.com/github/awesome-copilot | Official GitHub-maintained skills: cache/concurrency/path-filter patterns to cut Actions minutes, pin actions & least-privilege `permissions:` hardening, and a CI-failure triage playbook. | The whole swarm runs on Actions Free; efficiency = more publishing runs inside the 2,000-min/month cap; hardening matters because the workflows hold Buffer/Groq/Stripe secrets. | MIT | **No.** |
| 8 | **AgriciDaniel/claude-seo** | https://github.com/AgriciDaniel/claude-seo | 26 sub-skills + 19 sub-agents for technical SEO, on-page, schema, Core Web Vitals, content audits; "free, open-source". | Audits `receiptspack.vercel.app` for landing-page conversion basics (meta, schema, speed, internal links) and builds an SEO action plan — the organic-search leg that complements short-form video. | MIT | **No.** Works from the live page; no Ahrefs/Semrush required. 27k stars. |
| 9 | **anthropics/skills — `skill-creator`, `frontend-design`, `webapp-testing`** | https://github.com/anthropics/skills | Official: how to author/evaluate your own skills (with eval viewer), opinionated front-end design guidance, and Playwright-based web app testing. | `skill-creator` lets you fold the project's own learned playbooks (hook library, posting cadence, Buffer quirks) into reusable project skills; `frontend-design` + `webapp-testing` polish and regression-test the landing page. | Apache-2.0 (per-skill `LICENSE.txt`) | **No.** |
| 10 | **phuryn/pm-skills — `ab-test-analysis`, `north-star-metric`, `value-prop-statements`, `positioning-ideas`** | https://github.com/phuryn/pm-skills | Product-management skill packs (data/analytics, marketing/growth, etc.). | `ab-test-analysis` gives statistically sound reads on CTA/hook tests with tiny samples; `north-star-metric` keeps the growth model honest. | MIT | **No.** 27.7k stars. |
| 11 | **blader/humanizer** | https://github.com/blader/humanizer | Single skill that strips AI-writing tells from generated text. | Final pass on captions, scripts, Reddit/Bluesky replies and landing copy so LLM-generated content from Groq/NIM doesn't read as botty. | MIT | **No.** 65k stars. |
| 12 | **OpenClaudia/openclaudia-skills — `bluesky`, `write-landing`, `page-cro`, `content-repurposing`** | https://github.com/OpenClaudia/openclaudia-skills | 77 marketing skills; `bluesky` covers AT Protocol posting norms (300-char limit, custom feeds, "no ads — organic reach is the only reach", reply culture). | Only verified Bluesky-specific skill found; fits the "community outreach without X" constraint. Many sibling skills (ahrefs, semrush, google-ads, apollo) need paid tools — install only the four named. | MIT | **No** for the named four. |
| 13 | **realkimbarrett/advertising-skills — `headline-matrix`, `scroll-stopping-creative`, `objection-crusher`, `generic-language-killer`, `avatar-extraction`** | https://github.com/realkimbarrett/advertising-skills | Direct-response copy system (Schwartz awareness mapping, hook/angle multipliers, creative testing). | Hook and headline generation frameworks transfer to organic short-form even though the repo is framed around paid ads; use the copy skills only, ignore media-buying ones. | MIT (README) | **No.** Knowledge-only. Lower rank due to paid-ads framing. |

---

## 3. Ranked shortlist (install order)

1. **kajisho5/ffmpeg-skill** — the only production-grade, offline, stdlib-only video toolkit; unlocks captions, reframes and platform exports in GitHub Actions. [repo](https://github.com/kajisho5/ffmpeg-skill)
2. **social-media-skills/skills** (14 selected skills) — platform growth models + hooks + scripts for TikTok/IG/YT plus Reddit etiquette and image prompting. [repo](https://github.com/social-media-skills/skills)
3. **coreyhaines31/marketingskills** (12 selected skills) — copywriting, CRO, A/B testing, analytics/attribution, pricing/offers, launch, video; ships Perplexity ZIPs. [repo](https://github.com/coreyhaines31/marketingskills)
4. **github/awesome-copilot** GitHub Actions trio — minutes efficiency, secret/permission hardening, CI triage. [repo](https://github.com/github/awesome-copilot)
5. **cloudflare/skills** — official Workers best practices for the Worker tier of the swarm. [repo](https://github.com/cloudflare/skills)
6. **stripe/ai `stripe-best-practices`** — payment flow correctness and key hygiene. [repo](https://github.com/stripe/ai/tree/main/providers/agent-plugins/plugin/skills)
7. **remotion-dev/skills** — branded programmatic templates + caption rendering (free under the ≤3-person license). [repo](https://github.com/remotion-dev/skills)
8. **AgriciDaniel/claude-seo** — landing-page SEO/technical audit. [repo](https://github.com/AgriciDaniel/claude-seo)
9. **anthropics/skills `skill-creator` + `frontend-design` + `webapp-testing`** — author project-specific skills; polish/test the landing page. [repo](https://github.com/anthropics/skills)
10. **blader/humanizer** — de-AI pass on all generated copy. [repo](https://github.com/blader/humanizer)
11. **phuryn/pm-skills `ab-test-analysis`, `north-star-metric`** — rigorous test reads and growth-model discipline. [repo](https://github.com/phuryn/pm-skills)
12. **OpenClaudia `bluesky`** (+ `write-landing`, `page-cro`) — Bluesky outreach norms. [repo](https://github.com/OpenClaudia/openclaudia-skills)

Optional 13th: realkimbarrett/advertising-skills copy-only subset (hooks/headlines) — useful, but overlaps #2/#3 and is framed around paid media.

Coverage check vs. the brief: short-form video (1, 7, 2-video), captions (1, 7), IG/TikTok/YT growth & hooks (2), copywriting/CTA testing (3, 11, 13), SEO/landing CRO (8, 3-cro, 9, 12), Stripe ops (6), GitHub Actions (4), Cloudflare Workers (5), image prompting (2-image-prompt, 3-image), analytics/attribution (3-analytics/attribution, 11), community outreach Bluesky/Reddit (12, 2-reddit-marketing, 3-community-marketing).

---

## 4. Skip list (with reasons)

| Skill / repo | Reason to skip |
|---|---|
| **openai/skills** (`gh-fix-ci`, `imagegen`, `transcribe`, `cloudflare-deploy`) — https://github.com/openai/skills | Repo is marked **Deprecated** on its own README and the skills target Codex (paid ChatGPT/OpenAI API). Equivalent GitHub-Actions coverage is in `github/awesome-copilot`. |
| **ComposioHQ/awesome-claude-skills** automation skills (`tiktok-automation`, `instagram-automation`, `youtube-automation`, `reddit-automation`) — https://github.com/ComposioHQ/awesome-claude-skills | Require a Composio account/API key and tool-router; adds a third-party dependency to a swarm that already publishes via Buffer Free. Keep the list as a discovery index only. |
| **video-db/skills** (listed in curated indexes) | Depends on the VideoDB cloud API (key/credits) — conflicts with "free, no card". ffmpeg-skill covers the same jobs locally. |
| **social-media-skills** mini-skills `opus-clip`, `capcut`, `heygen`, `veo-3`, `runway`, `kling`, `luma`, `synthesia`, `suno`, `x-growth`, `ugc-and-influencer`, `scheduling-and-queue` (WoopSocial) | Wrap paid SaaS tools, X/Twitter, or paid creators — all excluded by the brief. The rest of the repo is fine. |
| **coreyhaines31/marketingskills** `ads`, `ad-creative`, `paywalls`, `sms`, `cold-email`, `influencer-marketing`, `aso` | Paid-ads, SMS/email-tool, or app-store topics not applicable to a $29 web digital product with no ad budget. |
| **OpenClaudia** `ahrefs-research`, `semrush-research`, `similarweb-traffic`, `google-ads*`, `facebook-ads`, `linkedin-ads`, `apollo-outreach`, `hubspot` | Each needs a paid SaaS subscription or ads budget. |
| **realkimbarrett/advertising-skills** media-buying skills (campaign diagnosis, funnel/paid-media) | Paid-ads framing; only the copy/hook skills are useful. |
| **davila7/computer-skills** — https://github.com/davila7/computer-skills | Only one skill (`skills-architecture-dashboard`), 5 stars; not relevant. Perplexity Computer consumes standard SKILL.md folders, so the marketingskills Perplexity ZIPs are the better route. |
| **get-zeked/perplexity-super-skills** | No license declared (GitHub API: none) — unclear reuse rights; content is single-file mega-prompts that overlap with #2/#3. |
| **zentered/atproto-skills** | No license, 1 star, protocol-level AT Proto dev knowledge rather than growth; OpenClaudia `bluesky` is sufficient. |
| **michalparkola/tapestry-skills-for-claude-code `youtube-transcript`**, **op7418/Youtube-clipper-skill** | Transcript/download of third-party YouTube content; low value for original-content publishing and carries ToS risk. |

---

## 5. Caveats and assumptions

- "Verified" means the GitHub page, raw `SKILL.md`, or GitHub API record was fetched on 2026-11-07; star counts and push dates come from the GitHub API at that time.
- License for `remotion-dev/skills` is not declared in that repo; the Remotion product license (free ≤3 people) is what governs rendering in CI. Re-check if the team grows.
- Skill content is advice to the agent; nothing here publishes or spends money on its own. Buffer Free remains the only publishing path, consistent with the existing swarm.

### Sources (all fetched)
- https://agentskills.io/specification
- https://github.com/anthropics/skills and https://github.com/anthropics/skills/tree/main/skills
- https://github.com/kajisho5/ffmpeg-skill
- https://github.com/coreyhaines31/marketingskills (+ raw `skills/video/SKILL.md`, `skills/social/SKILL.md`, `skills/community-marketing/SKILL.md`, `skills/attribution/SKILL.md`, GitHub Releases v2.14.2)
- https://github.com/social-media-skills/skills (+ `skills/tiktok-growth`, `hook-writer`, `captions-and-clipping`, `image-prompt`, `reddit-marketing` SKILL.md)
- https://github.com/remotion-dev/skills (+ raw `skills/remotion-captions/SKILL.md`), https://www.remotion.dev/license
- https://github.com/cloudflare/skills
- https://github.com/stripe/ai/tree/main/providers/agent-plugins/plugin/skills and https://github.com/stripe/agent-toolkit
- https://github.com/github/awesome-copilot (skills `github-actions-efficiency`, `github-actions-hardening`, `diagnose-ci-gate`)
- https://github.com/AgriciDaniel/claude-seo
- https://github.com/phuryn/pm-skills
- https://github.com/blader/humanizer
- https://github.com/OpenClaudia/openclaudia-skills (+ `skills/bluesky/SKILL.md`)
- https://github.com/realkimbarrett/advertising-skills
- https://github.com/openai/skills
- https://github.com/ComposioHQ/awesome-claude-skills, https://github.com/VoltAgent/awesome-agent-skills (discovery indexes)
- https://github.com/davila7/computer-skills, https://github.com/get-zeked/perplexity-super-skills, https://github.com/zentered/atproto-skills
