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
