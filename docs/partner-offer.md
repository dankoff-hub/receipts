# Receipts Partner Programme — offer, terms, outreach, payout runbook

Version 2026-11-07. Public page: https://receiptspack.vercel.app/partners · Terms: /partners/terms · Config: `content/partner-program.json`

## 1. The offer (what a partner gets)

| Item | Value |
|---|---|
| Commission | **50% of each completed sale = $14.50 on the $29 pack** |
| Founding rate | Locked 12 months for partners who join before 31 Jan 2027 |
| Attribution | 60 days, first-party cookie set by `receiptspack.vercel.app/p/<code>`, last partner link wins, partner beats organic source |
| Payout | Monthly by the 5th for the previous month, PayPal or Wise, minimum $30, 14-day hold, roll-over below minimum |
| Free product | Full Receipts Pack, so the partner can try it before recommending |
| Cost / exclusivity / quota | None |
| Disclosure | Required: "#ad" / "affiliate link" up front (FTC Endorsement Guides; UK CAP Code) |

## 2. Why 50% (commission rationale)

- Digital products have zero marginal cost, so sharing 30–50% is normal; **50% is the recommended rate for products priced $10–$30 and for launches** where partners need a reason to put real effort behind it ([SendOwl](https://www.sendowl.com/blog/tips-and-advice/affiliate-program-digital-products)).
- Info products typically pay 30–50%; low-priced products need **higher** percentages because affiliates judge the dollar amount per sale and earnings-per-click, not the percentage ("10% on a $20 product = $2 per sale is not enough to motivate someone to send their list") ([Matt McWilliams](https://www.mattmcwilliams.com/what-is-a-good-affiliate-commission-rate/)).
- Gumroad direct affiliates are set by sellers anywhere from 1–75%, so a 50%+ founding rate is inside market norms and easy to explain ([Gumroad help](https://gumroad.com/help/article/333-affiliates-on-gumroad)).
- 50% is a clean, memorable promise ("we split it") and scales automatically if the price changes; we net about $27.70 per sale after Stripe, $13.20 after commission, still positive on a zero-cost product.
- Cookie: 30 days is the most common window (45% of programmes), but 60–90 is advised for products people think about for a while and for one-off newsletter mentions ([systeme.io](https://systeme.io/learn/start-an-affiliate-program), [SendOwl](https://www.sendowl.com/blog/tips-and-advice/affiliate-program-digital-products)). We use 60.
- Payout: monthly on a fixed day with a $25–$50 minimum is the modern norm for digital products ([SendOwl](https://www.sendowl.com/blog/tips-and-advice/affiliate-program-digital-products)).
- Micro creators (10k–100k) convert affiliate traffic at 1.5–4% versus 0.5–2% for macro accounts, so the partner list deliberately targets 1k–200k and fit over size ([InfluencerFee](https://influencerfee.com/blog/instagram-influencer-statistics-2025/)); a 2,000-reader niche newsletter typically outsells a general 200k account ([SendOwl](https://www.sendowl.com/blog/tips-and-advice/affiliate-program-digital-products)).

**Expected economics per partner (honest):** a creator with median 1,000 views/video posting 1 tagged video/week → ~4,000 views/month → 1–3% click to link ≈ 40–120 clicks → 3–5% buy on a warm, trusted referral ≈ 1–6 sales ≈ $14–$87/month to the partner, about the same to us. Newsletters do better per reader. 40 active partners ≈ 60–240 sales/month. That is a real contribution, not the whole target; it compounds with the content swarm and the email list.

## 3. Payback (payout) channel — zero fixed cost

1. **Ledger (automated, read-only):** `scripts/affiliate-ledger.mjs` reads paid Stripe Checkout Sessions, credits any `client_reference_id` containing `aff_<code>`, removes refunds/disputes, applies the 14-day hold, writes `content/affiliate-ledger.json` (counts only) and on the 1st–5th opens the issue **"Partner payouts YYYY-MM"** with one line per partner.
2. **Payment (founder, Critical tier):** PayPal — sending a goods-and-services payment costs the sender nothing in the UK and an international friends-and-family transfer is capped at £2.99 ([PayPal UK fees](https://www.paypal.com/uk/digital-wallet/paypal-consumer-fees)); Wise Business batch payments as the alternative for partners without PayPal ([Wise](https://wise.com/gb/blog/how-to-pay-global-employees-using-wise-business-batch-payments)). No subscription, no card on file for the swarm, no third-party affiliate SaaS (PromoteKit/Rewardful start billing after the first referrals).
3. **Statement to partner:** one line (month, sales, amount) sent with the payment; via Mailjet once approved, else from the founder's mailbox.
4. Partner payout details (PayPal email) live only in the private Vercel Blob (`partners/applications/`) and the founder's records, never in this public repo.

## 4. Partner link mechanics

- `/p/<code>` (a–z, 0–9, 2–24 chars) → sets cookie `rp_ref` (60 days) → redirects to `/free?src=aff_<code>-p` (or `?to=pricing`).
- Every checkout link on `/`, `/bio`, `/free`, `/pricing` passes `client_reference_id = aff_<code>-<src>` (or `free_aff_<code>-<src>`), which Stripe stores on the session ([Stripe docs](https://docs.stripe.com/payment-links/url-parameters)).
- Partner codes are assigned by the founder when accepting an application; a code only needs to appear in the ledger once a sale happens, so there is nothing to pre-register.

## 5. Outreach copy (approval required before the first send; then High tier, cap 10/day)

Rules: short (≤3 paragraphs), individual first line that proves we watched/read them, state the terms, offer the free pack, one ask. Never promise earnings. No refund or guarantee language.

### Instagram / YouTube DM (≤ 500 chars)
<!-- DM -->
Hi {first} — I watched your recent videos on staying disciplined when nobody is cheering; that is exactly who Receipts is for. It is a $29, 30-day "keep the receipt" system (Step 1 is free: receiptspack.vercel.app/free). I would like to send you the full pack free and, if you think it fits, give you a partner link receiptspack.vercel.app/p/{code} that pays you 50% of every sale ($14.50), monthly by PayPal, no quota, no exclusivity. Want me to send it over? — Dan, Receipts
<!-- /DM -->

### Email (creators and newsletter writers)
Subject: 50% per sale on a 30-day "receipts" system your readers would use

Hi {first},

{one specific line about their last post/video and why it maps to "they said you weren't ready — keep the receipt".}

I run Receipts, a $29, 30-day proof system for people who were underestimated: write the receipt once, then log one honest line a day until it is irrelevant. Step 1 is free (receiptspack.vercel.app/free), so your readers can try it before paying anything.

Partner terms, one page: 50% of every completed sale ($14.50 on $29), 60-day attribution, monthly PayPal/Wise payout by the 5th, no quota, no exclusivity, rate locked 12 months. I would send you the full pack free first so you can decide honestly. If yes, your link would be receiptspack.vercel.app/p/{code}. Terms: receiptspack.vercel.app/partners/terms

Dan Rossi — Receipts (Tealstone Consulting Ltd, 61 Bridge Street, Kington, Herefordshire, HR5 3DJ)

### Newsletter P.S. the partner can paste
P.S. If someone told you that you weren't ready this year: Receipts is a 30-day system for keeping the receipt and making it irrelevant. Step 1 is free: receiptspack.vercel.app/p/{code} (affiliate link).

## 6. Pipeline (agent 9: partner swarm, `.github/workflows/partner-swarm.yml`, daily 09:00 UTC)

1. `scripts/partner-scout.py` — 4 rotating YouTube channel searches (public pages, no key), filter 1k–200k subs, score fit, refresh 12 stale prospects, write `content/partner-prospects.json` (public data only), open "Partner outreach queue <date>" issue with ready-to-paste DMs for the top 10 uncontacted.
2. `scripts/affiliate-ledger.mjs` — Stripe → ledger → monthly payout statement issue.
3. Founder/approved sender posts the DMs (cap 10/day, High tier), marks `status: contacted`; on a yes, replies with code + free pack, sets `status: partner` and adds the code to `content/partners.json`.
4. Instagram-only prospects: DM from @danrossi2026 in the app (web DMs risk the account). Newsletter prospects: email.

## 7. Critical-tier items (human only)
Agreeing terms with a partner, changing the commission, paying out, ending a partnership, any paid placement.
