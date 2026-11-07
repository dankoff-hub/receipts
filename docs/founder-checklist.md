# Founder checklist — tappable paths (10 minutes, phone)

Everything below is on accounts only you can log into. Each one turns a dead end into a one-tap path to receiptspack.vercel.app/free.

## Instagram (@danrossi2026) — 1 minute, phone app only
Instagram allows link edits only in the mobile app (web says "Editing your links is only available on mobile"; the web edit endpoint ignores the field — tested 2026-11-07). In the app: Edit profile → Links → Add external link → `https://receiptspack.vercel.app/free?src=ig`, title "Free Step 1 template". Until then the current link `/bio?src=ig` works: its first button is the free template and attribution is kept — one extra tap.
Also in the app: display name has a typo ("Reciepts") — fix to "Dan Rossi • Receipts | 30-Day Proof System" once the 14-day name-change lock expires (Instagram blocked it on 2026-11-07: "changed twice within 14 days").
Security: the Instagram password was pasted into chat — change it, and note login codes go to your d*****f@gmail.com inbox, so any future web login by the swarm needs you to forward the code.

## TikTok (@dan.rosa71) — Business account since 2026-11-07; 5 minutes in the phone app
Confirmed on web: "Business tools unlocked" (advanced analytics, comment management, Business Page URL/email). Web still cannot save the bio or add the Website field (tested twice on 2026-11-07: the update call returns 200 with an empty body and nothing changes), and auto-messages are app-only, so these are yours — all text is ready to paste in `content/profile.json`:
1. ~~Website~~ DONE 2026-11-07: tappable `receiptspack.vercel.app/bio?src=tt` verified on the profile; `tiktok_bio_link_live: true`, captions now say "tap the link in my bio". First-comment link keeps running.
2. ~~Bio~~ DONE 2026-11-07 ("Doubted? Keep the receipt. 30 days. Proof. Free Step 1 template: tap the link").
3. Edit profile → **Category**: Personal blog. Business Page email: the ops Gmail. Add the Instagram and YouTube buttons.
4. Settings and privacy → Privacy → Direct messages → **Everyone** (required for auto-messages).
5. Menu → **Business suite → Message center**: turn on Welcome message, Keyword reply, Suggested questions; paste `tiktok_welcome_message`, the three `tiktok_keyword_replies` and `tiktok_suggested_questions` from `content/profile.json`. Each goes to TikTok moderation (usually under 24h).
Note: Business accounts may only add sounds from the Commercial Music Library inside the app. Our uploads carry their own Mixkit audio in the file, so nothing changes for the pipeline — just never add an in-app sound on top. Username change to danrossi2026 was refused ("not available") — leave it.

## YouTube (@DanRosa-u5v) — done by the swarm 2026-11-07
Channel links now: 1) Free Step 1 template → receiptspack.vercel.app/free?src=yt, 2) Instagram, 3) Full 30-day pack $29 → /pricing?src=yt. Description carries both URLs. Every Short (10) has a creator comment with the free link. Pinning is locked by YouTube until the channel has "more history" — re-try pinning in a few weeks (watch page → comment ⋮ → Pin).

## Day-1 reminder emails — waiting on Mailjet, not you
Mailjet free account (tryuderzhi@gmail.com) is verified; business-verification ticket #4331805 is under review. Sending and the API secret key unlock when they approve; the code, cron job and privacy page are already live. Footer address: Tealstone Consulting Ltd, 61 Bridge Street, Kington, Herefordshire, HR5 3DJ (Companies House 15180506).
Fallback if Mailjet declines: Brevo account exists on the same email but needs an SMS phone verification before it issues an API key — that step is yours (Settings → SMTP & API → Generate API key → "Add a phone number").

## TikTok first comment (automated)
A daily job (13:15 London) comments the free link under every new TikTok video. Pinning the comment is hover-only on web; in the TikTok app, long-press the creator comment → Pin. Optional, it is already the only comment.

## Stripe checkout — simplified 2026-11-07 (founder-approved)
Done via the API: the required "Immediate access" dropdown is gone, replaced by Stripe's single consent checkbox carrying the same 14-day cancellation-waiver wording (express consent kept); submit button reads "Pay"; note under it: "Instant access: your pack opens right after payment. One-time $29, no subscription." — UK check 2026-11-07: UK visitors see £22.59 (US$29 at 0.7790 incl. 4% conversion fee, Tax £0.00) with a currency toggle, so the next run of the Stripe setup workflow makes this note currency-neutral ("One-time payment, no subscription"). Run it yourself: Actions → "Stripe fulfillment setup (idempotent)". Verified live: email → payment method → one checkbox → Pay. The waiver wording itself is legal text — change it only yourself.
Still Dashboard-only (no API field): **Adaptive Pricing** shows non-US visitors a local-currency price with a conversion-fee line. To show USD only: Dashboard → Settings → Payments → Adaptive Pricing → off (or the link's Edit → Advanced options). Your call — it is a trade-off between familiarity and the fee line.

## Security housekeeping — 5 minutes
Instagram and Google (tryuderzhi@gmail.com) passwords were pasted into chat at some point — rotate both. Regenerate the NVIDIA API key (also pasted) and update the `NVIDIA_API_KEY` repo secret. Still pending on third parties, nothing for you to do: Reddit API approval, Lemmy, Mailjet ticket #4331805.

## Partner programme — nothing daily; 5 minutes monthly
Approved 2026-11-07: the swarm sends partner outreach itself (Instagram DMs from @danrossi2026 web session + emails from the ops Gmail), varied timing (10:20 / 14:45 / 19:10 London via Perplexity automations), one unique text per prospect, max 20 per day; commission fixed at 50% = $14.50. Runbook: `docs/partner-sender.md`. Day-1 sends: 3 IG DMs + 1 email.
1. Watch for `status: needs_founder` in `content/partner-prospects.json` (money/legal questions from prospects) — only you answer those.
2. If Instagram ever shows "action blocked", the sender stops itself; you may continue from the app.
3. Partner "yes" → the swarm sends the pack copy link (`/pack?partner=<code>&k=…`) and adds the code to `content/partners.json`; nothing for you to do.
4. Stripe: Developers → API keys → the restricted key → enable "Charges and Refunds: Read" so the ledger can remove refunds/disputes automatically. Otherwise glance at the dashboard before each payout.
5. Monthly (1st–5th): the "Partner payouts YYYY-MM" issue lists who is owed what; pay by PayPal (goods & services) or Wise, tick, close.
