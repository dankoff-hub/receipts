# Partner sender runbook (swarm-operated, cross-platform; approved 2026-11-07)

Approval on record: the swarm sends partner outreach itself with **varied timing, one unique text per prospect, max 20
messages per day in total and max 8 per platform**, across every platform where the ops accounts are logged in. Commission
is fixed at **50% = $14.50** per completed $29 sale. Four windows a day; each window sends and then sweeps every inbox
and replies.

## Windows (Europe/London) — Perplexity automations, source thread (browser logins live there)
| Window | Sends | Also |
|---|---|---|
| 09:40 | ≤5 | sweep + replies |
| 13:20 | ≤5 | sweep + replies |
| 16:50 | ≤5 | sweep + replies |
| 20:30 | ≤5 | sweep + replies, daily tally commit |

## Platforms and routes
| Platform | Account | Outreach action | Text used | Sweep |
|---|---|---|---|---|
| Instagram | @danrossi2026 (web) | profile → Message → paste → Send | `drafts.dm_opener` (first contact only) | direct/inbox Primary, General, Requests |
| Gmail | ops mailbox | compose to a **public** author address (never stored in repo) | `drafts.email_subject` + `drafts.email` | inbox, newer_than:1d |
| Substack | ops account "Dan Rossi" | `substack.com/@<pub>` → Message → paste → send arrow | `drafts.dm` | substack.com/inbox (Direct) |
| YouTube | @DanRosa-u5v (Google) | comment on the prospect's `latest_video` (no links; links get held) | `drafts.short` | comments on our own videos (Studio → Comments) — reply to every real comment |
| TikTok | @dan.rosa71 (Business Suite) | comment on the prospect's latest video (`tt`) | `drafts.short` | business-suite/messages + comments on our videos |
| Threads | not logged in yet | — | — | — |
| Bluesky / Mastodon | API, GitHub swarm | no outreach (no prospects there) | — | posted by revenue-swarm; no DM sweep |

Route order per prospect: Instagram → Substack (newsletter kinds) → email (if public address) → TikTok → YouTube comment.

**First message rule (2026-11-07, after the Substack suspension): the first message NEVER contains a link or an offer.** It is a 1-2 line, specific compliment plus a question ("do you take partner collabs?"). The full offer + partner link goes only in the second message, after they reply. No links in cold YouTube/TikTok comments either — links get held and accounts flagged. `drafts.dm_opener` is the first message; `drafts.dm_followup` (formerly `dm`) is the reply copy.
One route per prospect; never two platforms for the same person on the same day.

## Per-window procedure
1. `cd /home/user/workspace/receipts && git checkout -q -- . && git pull -q --rebase`; `node scripts/partner-log.mjs x y --check`
   → stop sending if `remaining` is 0; skip any platform whose `platform_remaining` is 0.
2. Pick `status: "prospect"` entries with drafts, highest score first, skipping `ig_dead`, `ig_private`, `needs_founder`, `route_exhausted`, and any `substack_blocked` value. Prefer a prospect with `ig` or `tt`. Do not attempt Substack — the ops account is suspended. First contact uses `drafts.dm_opener` only (no link, no offer, no price). `drafts.dm` is the reply after they answer.
3. Send with the route table. Verify every send in the page (text visible in thread/comment list, box empty).
4. Log immediately: `node scripts/partner-log.mjs "<prospect key>" <ig|email|substack|yt|tiktok> <label>` (exit 2 = cap → stop).
5. Sweep all inboxes/comment feeds. Positive reply → run `PARTNER_PACK_SECRET=$(cat ~/.config/receipts/partner.key) node scripts/partner-grant.mjs <drafts.code>`
   (never print the secret), reply with pack copy link + partner link + terms URL, set `status: partner`, append to `content/partners.json`.
   "No" → `status: declined`. Money/legal/anything not covered by docs/partner-offer.md → `status: needs_founder`, no answer.
   Comments on our own videos: reply briefly and specifically (no links, no sales push); these do not count toward the 20.
6. Commit `content/partner-prospects.json content/partner-outreach-log.json content/partners.json` via `scripts/git-push-safe.sh`.

## Hard rules
- 20/day total, 8/platform (enforced by `partner-log.mjs`). Substack override is 0. Do not raise IG, YouTube, or TikTok. Never the same text twice. No refund/guarantee/earnings wording.
- One nudge after 7 days, then stop. Stop a platform for the day on any "action blocked / try again / unusual activity" notice (`<platform>_blocked: <date>` on the prospect).
- Never send the HMAC pack link cold. Never create payments, accept legal terms, or change the commission.

## Log
- 2026-11-07 day 1: IG DMs @Myelia_irl, @Forged4Future, @officialconnerspencer, @MissionSideHustle, @KeyToDiscipline_, @ChadEveryday, @lettersbyari; email The Soft Stoic Letter; Substack DM 7% Better (route validated 18:13). Dead/blocked: @discipline7q IG link dead; pathsofstoicism IG dead; tom.hu23 private. Sweeps: no replies yet. 9/20.
- 2026-11-07 20:30 window: Substack DM Practical Stoic Advice (sent 20:31) → ops Substack account SUSPENDED seconds later (Spam & Phishing policy). Substack route stopped (substack_blocked on 5 newsletter prospects, channel paused in audience-config); appeal is founder-only. Window cut short by founder request. 10/20.
- 2026-11-08 day tally: IG 5, email 1, TikTok comments 2, YouTube comments 7. No partner replies. Substack still blocked. Sendable pool empty after marking @Tom.Bidgood route exhausted (TikTok handle is a different person). 15 sent.
- 2026-11-09 day tally: IG 1 (@TheTreasureShow, opener only). Email 0, TikTok 0, YouTube 0. Replies: 1 (Dan Zakaria, not a yes, no pack link). Partners: 0. Substack still suspended. Sendable pool empty. 1 sent.
