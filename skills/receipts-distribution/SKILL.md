---
name: receipts-distribution
description: "Connect Receipts Pack generators to vendored skills and free-infra bots. Use when wiring skillHint, adding a swarm bot, or deciding which channel a $29 proof product may post to."
---

# Receipts distribution

`skillHint(name, max)` in `swarm/llm.mjs` is the connection point. It reads `skills/<name>/SKILL.md` and returns a short excerpt. Append that excerpt to an existing prompt. Do not replace the generator's rules.

## Which generator loads which skill

- `scripts/partner-drafts.mjs`: `humanizer` (280), `social-reply-and-comment-writer` (280). Also writes `drafts.dm_opener` only when missing: 1-2 lines, a specific compliment from title/about, one question, no link, offer, price, or URL.
- `scripts/content-forge.mjs`: LLM path only appends `social-short-form-video-script`, `social-tiktok-growth`, and `content-repurposing`. Template fallback stays untouched.
- `scripts/partner-drafts.mjs` also loads `value-prop-statements`.
- `scripts/seo-publisher.mjs` must load `seo-programmatic` when it writes guide pages. Do not add a paid SEO tool.
- `scripts/cta-lab.mjs` and `scripts/guerrilla-bot.mjs`: no network call. Comments point at `social-link-in-bio-and-traffic` and `humanizer`.
- `swarm/creative.mjs`: `social-hook-writer`, `humanizer`, and `social-tiktok-growth` (200) in the same system prompt. Posting behavior stays as-is.

## Hard bans

- No X. No paid ads. No card. No refund, guarantee, or income claims.
- No Reddit or Skool automation. No new logins.
- No HMAC pack link in cold outreach.
- Unique text per post. Do not reuse one caption across channels or prospects.
- Do not overwrite an existing `dm_opener`.

## Free infra only

GitHub Actions, Vercel, Cloudflare Workers, Buffer free, Bluesky, Mastodon. If a channel needs a paid seat, a new account, or a card, skip it.

`scripts/skill-wire-check.mjs` exits 1 if a wired file is missing its skill name, or if this skill file is missing.
