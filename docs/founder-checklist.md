# Founder checklist — tappable paths (10 minutes, phone)

Everything below is on accounts only you can log into. Each one turns a dead end into a one-tap path to receiptspack.vercel.app/free.

## Instagram (@danrossi2026) — 1 minute, phone app only
Instagram allows link edits only in the mobile app (web says "Editing your links is only available on mobile"; the web edit endpoint ignores the field — tested 2026-11-07). In the app: Edit profile → Links → Add external link → `https://receiptspack.vercel.app/free?src=ig`, title "Free Step 1 template". Until then the current link `/bio?src=ig` works: its first button is the free template and attribution is kept — one extra tap.
Also in the app: display name has a typo ("Reciepts") — fix to "Dan Rossi • Receipts | 30-Day Proof System" once the 14-day name-change lock expires (Instagram blocked it on 2026-11-07: "changed twice within 14 days").
Security: the Instagram password was pasted into chat — change it, and note login codes go to your d*****f@gmail.com inbox, so any future web login by the swarm needs you to forward the code.

## TikTok (@dan.rosa71) — partly done 2026-11-07
Done on web: profile photo, bio ("They said you weren't ready. Keep the receipt. 30 days. One standard. Proof."), 4 duplicate uploads deleted (restorable 30 days via Activity centre → Recently deleted).
Phone-app only (TikTok hides these on web): Settings → Account → Switch to Business account (free) → Edit profile → Website: `https://receiptspack.vercel.app/free?src=tt`; add the Instagram and YouTube buttons. Username change to danrossi2026 was refused ("not available") — leave it.

## YouTube (@DanRosa-u5v) — done by the swarm 2026-11-07
Channel links now: 1) Free Step 1 template → receiptspack.vercel.app/free?src=yt, 2) Instagram, 3) Full 30-day pack $29 → /pricing?src=yt. Description carries both URLs. Every Short (10) has a creator comment with the free link. Pinning is locked by YouTube until the channel has "more history" — re-try pinning in a few weeks (watch page → comment ⋮ → Pin).

## Day-1 reminder emails — waiting on Mailjet, not you
Mailjet free account (tryuderzhi@gmail.com) is verified; business-verification ticket #4331805 is under review. Sending and the API secret key unlock when they approve; the code, cron job and privacy page are already live. Footer address: Tealstone Consulting Ltd, 61 Bridge Street, Kington, Herefordshire, HR5 3DJ (Companies House 15180506).
Fallback if Mailjet declines: Brevo account exists on the same email but needs an SMS phone verification before it issues an API key — that step is yours (Settings → SMTP & API → Generate API key → "Add a phone number").

## TikTok first comment (automated)
A daily job (13:15 London) comments the free link under every new TikTok video. Pinning the comment is hover-only on web; in the TikTok app, long-press the creator comment → Pin. Optional, it is already the only comment.

## Stripe checkout — 2 minutes, your decision
The buy link currently makes every buyer (1) pick a currency with a 4% conversion fee shown, (2) answer a required dropdown "Immediate access (see note below)", and (3) tick "I agree and accept the loss of my cancellation right". The waiver is legal text, so the swarm left it alone. If you want fewer drop-offs: Stripe Dashboard → Payment links → this link → Edit → remove the custom dropdown, keep the consent checkbox, and consider turning adaptive pricing off (USD only, no fee line).

## Security housekeeping — 5 minutes
Instagram and Google (tryuderzhi@gmail.com) passwords were pasted into chat at some point — rotate both. Regenerate the NVIDIA API key (also pasted) and update the `NVIDIA_API_KEY` repo secret. Still pending on third parties, nothing for you to do: Reddit API approval, Lemmy, Mailjet ticket #4331805.

## Partner programme — 10 minutes, then 5 minutes a day
1. Approve (or edit) the DM/email wording in `docs/partner-offer.md` §5 and say who sends: you from the Instagram app (safest for IG-only creators) and/or the swarm from tryuderzhi@gmail.com for newsletter writers with an email. Until then nothing is sent.
2. Each morning open the newest "Partner outreach queue" issue (first one: https://github.com/dankoff-hub/receipts/issues/26), paste up to 10 messages, mark `status: contacted`.
3. On a yes: reply with the free pack and the link `receiptspack.vercel.app/p/<code>` (code = their handle, letters/digits only), set `status: partner`, add the code to `content/partners.json`.
4. Stripe: Developers → API keys → the restricted key → enable "Charges and Refunds: Read" so the ledger can remove refunds/disputes automatically. Otherwise glance at the dashboard before each payout.
5. Monthly (1st–5th): the "Partner payouts YYYY-MM" issue lists who is owed what; pay by PayPal (goods & services) or Wise, tick, close.
