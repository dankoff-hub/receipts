# Partner sender runbook (swarm-operated, approved 2026-11-07)

Approval on record: the swarm sends partner outreach itself — Instagram DMs from the logged-in @danrossi2026 web
session and emails from the ops Gmail — with **varied timing across the day, non-identical messages, and at most 20
messages per day** across all channels. Commission is fixed at **50% = $14.50** per completed $29 sale.

## Daily loop (3 windows, Europe/London)
| Window | Who runs it | What it does |
|---|---|---|
| 10:20 | Perplexity automation "Partner outreach — morning" | up to 7 sends |
| 14:45 | "Partner outreach — afternoon" | up to 7 sends |
| 19:10 | "Partner outreach — evening" | up to 6 sends + reply sweep |

Each window:
1. `git pull`, then `node scripts/partner-log.mjs x y --check` → stop if `remaining` is 0.
2. Pick prospects with `status: "prospect"` **and** a `drafts.dm` / `drafts.email` (written by `scripts/partner-drafts.mjs`
   in the 09:00 UTC partner-swarm run — one unique text per prospect, rules-checked; never reuse a text).
3. Channel order: Instagram DM if the prospect has a working `ig` link (open profile → Message → paste `drafts.dm` → Send;
   dismiss the "Turn on notifications" dialog with Not Now); otherwise email if a public address is known (Gmail web,
   subject = `drafts.email_subject`, body = `drafts.email`); otherwise Substack "Message" where the author enables it.
   Email addresses stay out of the public repo — the log stores a role label such as `substack-author`, not the address.
4. After each confirmed send: `node scripts/partner-log.mjs "<handle>" <ig|email|substack>` (sets `status: contacted`, counts the cap).
5. Reply sweep (every window): Instagram inbox + Gmail inbox. On a positive reply: build the partner copy link with
   `PARTNER_PACK_SECRET=$(cat ~/.config/receipts/partner.key) node scripts/partner-grant.mjs <code>`, send it with the partner
   link and terms, set `status: partner`, append `{code, handle, since}` to `content/partners.json`. On a "no": `status: declined`.
   Questions about money, legal terms or anything outside docs/partner-offer.md → `status: needs_founder` and stop (Critical).
6. Commit `content/partner-prospects.json content/partner-outreach-log.json content/partners.json` via `scripts/git-push-safe.sh`.

## Hard rules
- Max 20 sends/day (enforced by `partner-log.mjs`, exit 2). Never two identical texts. No earnings claims, no refund or
  guarantee wording, no follow-up more than once per prospect (one nudge after 7 days, then stop).
- Instagram: stop the window immediately if any "action blocked / try again later" notice appears; mark `ig_blocked: <date>`.
- Never send the HMAC pack link in cold outreach — only after a yes.

## Day 1 (2026-11-07)
IG DMs: @Myelia_irl (17:37), @Forged4Future, @officialconnerspencer. Email: The Soft Stoic Letter (17:38).
`@discipline7q` IG link is dead (page not available) — needs YouTube comment/email route instead.
