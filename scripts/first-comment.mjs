// First comment with the system link, for platforms where the post itself cannot carry a tappable link.
// Rotates wording (never the same two days running) but the URL is always the same, short and typeable.
const URL = "receiptspack.vercel.app/free";
const LINES = {
  instagram: [
    `Step 1 is free — tap the link in my bio, or type ${URL}`,
    `The free receipt template (Step 1 of 5) is at ${URL} — also in my bio.`,
    `Want the template from the video? Link in bio → ${URL}`,
    `Free Step 1 sheet: ${URL} (link in bio). The full 30-day pack is $29, one-time.`,
    `Start here, free: ${URL} — it is the link in my bio.`,
    `Everything in this post comes from one system. Step 1 is free: ${URL}`,
    `Template is free, no sign-up: ${URL} (link in bio).`,
  ],
  tiktok: [
    `Step 1 is free. Type this in your browser: ${URL}`,
    `The template from this video, free: ${URL}`,
    `Free receipt template (Step 1 of 5): ${URL} — no sign-up.`,
    `Want the sheet? ${URL} — free. The full 30-day pack is $29 once.`,
    `Start the 30 days free: ${URL}`,
    `Everything here comes from one system. Step 1 is free at ${URL}`,
    `Template, free, 10 minutes: ${URL}`,
  ],
};
export function firstComment(platform, seed = new Date()) {
  const bank = LINES[platform] || LINES.tiktok;
  const day = Math.floor(seed.getTime() / 86400000);
  return bank[day % bank.length];
}
// Buffer free plan rejects Instagram `firstComment` ("First comment requires a paid plan", seen 2026-11-07 16:30 UTC),
// so on Instagram the same rotating line goes at the END of the caption instead (plus the bio link). Never pass firstComment to Buffer.
export function withLinkLine(caption, platform = "instagram", seed = new Date()) {
  const c = String(caption || "").trimEnd();
  if (c.includes(URL)) return c;
  return c + "\n\n" + firstComment(platform, seed);
}
export { URL as SYSTEM_URL };

// 2026-11-07: first comments double as engagement bait — link + one question, so people can reply
// with their own "receipt" (comments are the strongest signal on TikTok/IG). Never repeated two days running.
const QUESTIONS = [
  "What's the one thing people said you couldn't do?",
  "What's your receipt — the proof you're holding?",
  "Drop the goal you're starting today.",
  "What did they say you weren't ready for?",
  "Day 1 is the hardest. What's yours?",
];
export function firstCommentWithQuestion(platform, seed = new Date()) {
  const day = Math.floor(seed.getTime() / 86400000);
  const q = QUESTIONS[day % QUESTIONS.length];
  const link = firstComment(platform, seed);
  return `${q}\n${link}`;
}
