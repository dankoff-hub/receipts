# Skool playbook (human-published, zero cost)

**Why no automation here.** Skool's platform policy: "Do not use bots or multiple accounts to post, comment, or message others. Also, refrain from scraping data or making automation requests" (https://help.skool.com/article/179-platform-policy). Terms §4 forbid accessing the service "manually or with any robot… to scrape, copy or monitor" and using it "for any commercial purpose, including… soliciting or selling to, any Users" (https://www.skool.com/legal?t=terms). No public API; cookie-based tools get accounts banned. Owning a community needs a card and $9–99/mo after 14 days (https://skoolmakers.com/guides/skool-pricing/) → outside the zero-cost mandate. **Decision: Critical tier — agents never touch skool.com. The swarm prepares; the founder publishes.**

**Where the buyers are (free to join, pick 3):**
| Community | Why |
|---|---|
| 30 Day Challengers — https://www.skool.com/30daychallengers/about | live monthly 30-day challenge, daily actions, "prove to yourself you can make it to Day 30" |
| 30-day challenges — https://www.skool.com/30-day-challenges-8583/about | new health/self-improvement challenge each month, weekly check-ins |
| Day by Day Wellness Club — https://skoolmakers.com/communities/category/personal-development/ | ~61k members, habits/productivity/journaling |
| Productivity Skool — https://proveworth.com/best/self-development-communities | free, rated for accountability & structure |
| Discipline OS / The Selfwork Club (free tier) — https://reviewmember.com/category/personal-development/ | discipline, focus, consistency |

**How the founder works it (15 min/day):**
1. Join with your real identity (Skool forbids shared/bot accounts). Profile bio: "30 days of receipts — free one-page tracker: receipts-blond.vercel.app/free?src=skool". That is the only place the link lives.
2. Daily: 2–3 comments from `content/skool-queue.md` (comment templates), adapted to the actual post. Never paste identical text twice.
3. Weekly: one value post from the queue (story → standard → daily one-line log → question). No link, no product name.
4. When someone asks "what tracker do you use?" answer in-thread with the method; point to the profile only if they ask for the file.
5. Track: `?src=skool` shows up in attribution (swarm/REVENUE_SWARM_REPORT.md).

**Swarm side (automated, compliant):** `swarm/skool.mjs` writes one fresh post + 3 comment templates per day into `content/skool-queue.md` and the daily brief issue; the Creative agent aims one concept per day at people inside 30-day-challenge communities (they are also on Instagram/YouTube/Bluesky, where we can reach them directly).

**If the founder wants an owned Skool community later:** Hobby plan is $9/mo + card. The swarm cannot start it (zero-cost rule); the founder would, and the daily queue would then feed it.
