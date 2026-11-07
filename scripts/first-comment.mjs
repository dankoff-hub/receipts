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
export { URL as SYSTEM_URL };
