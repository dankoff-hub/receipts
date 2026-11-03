# Receipts — operating model (free tier, zero API keys)

- Site: Vercel Hobby, auto-deploys from `main` via GitHub Actions (`deploy.yml`).
- Daily 06:00 GMT: `daily-tiktok.yml` generates a 1080x1920 video (free TTS + ffmpeg), commits it (Vercel hosts it), schedules it to TikTok via Buffer free-plan API, and opens a GitHub issue brief. Fully autonomous once BUFFER_API_KEY is set.
- Primary channel: organic TikTok. No paid ads. No X.
- Payments: Stripe payment link (founder-controlled). Delivery: /pack/<private-slug>.
- Nothing posts automatically; the founder records and posts the daily video.

## One-time setup for autonomous TikTok posting (free)
1. Create a free Buffer account → connect your TikTok account as a channel.
2. Buffer → Settings → API → create API key.
3. GitHub repo → Settings → Secrets → Actions → `BUFFER_API_KEY`.
4. Run the "Daily TikTok" workflow once manually to verify; afterwards it runs at 06:00 GMT daily.
Limits: Buffer Free = 3 channels, 10 queued posts per channel; TikTok auto-publish uses original audio only.
