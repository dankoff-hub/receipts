# Founder checklist — tappable paths (10 minutes, phone)

Everything below is on accounts only you can log into. Each one turns a dead end into a one-tap path to receiptspack.vercel.app/free.

## Instagram (@danrossi2026) — 1 minute, phone app only
Instagram allows link edits only in the mobile app (web says "Editing your links is only available on mobile"; the web edit endpoint ignores the field — tested 2026-11-07). In the app: Edit profile → Links → Add external link → `https://receiptspack.vercel.app/free?src=ig`, title "Free Step 1 template". Until then the current link `/bio?src=ig` works: its first button is the free template and attribution is kept — one extra tap.
Also in the app: display name has a typo ("Reciepts") — fix to "Dan Rossi • Receipts | 30-Day Proof System" once the 14-day name-change lock expires (Instagram blocked it on 2026-11-07: "changed twice within 14 days").
Security: the Instagram password was pasted into chat — change it, and note login codes go to your d*****f@gmail.com inbox, so any future web login by the swarm needs you to forward the code.

## TikTok (@dan.rosa71) — 3 minutes
1. Edit profile → Bio: "30 days of receipts. Free Step 1 template: receiptspack.vercel.app/free" (text is not tappable, but it is copyable).
2. Edit profile → Links → add **Instagram** (@danrossi2026) and **YouTube** (channel). These need no follower minimum; captions already say "tap Instagram".
3. Settings → Account → Switch to Business account → Business verification (unlocks the Website field below 1,000 followers; may need a business document).

## YouTube (channel UC_Io87isTmHUvzIAs-RwiFw) — 3 minutes
1. YouTube Studio → Customisation → Basic info → Links → `https://receiptspack.vercel.app/free?src=yt` ("Free Step 1 template").
2. For each Short: open comments → write "Free Step 1 template: https://receiptspack.vercel.app/free?src=yt" → Pin. (Links in YouTube comments are tappable; the description on Shorts is hidden behind a tap.)

## Day-1 reminder emails — waiting on Mailjet, not you
Mailjet free account (tryuderzhi@gmail.com) is verified; business-verification ticket #4331805 is under review. Sending and the API secret key unlock when they approve; the code, cron job and privacy page are already live. Footer address: Tealstone Consulting Ltd, 61 Bridge Street, Kington, Herefordshire, HR5 3DJ (Companies House 15180506).
Fallback if Mailjet declines: Brevo account exists on the same email but needs an SMS phone verification before it issues an API key — that step is yours (Settings → SMTP & API → Generate API key → "Add a phone number").
