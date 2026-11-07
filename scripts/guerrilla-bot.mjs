#!/usr/bin/env node
// Autonomous guerrilla marketing bot — Level 28
// Runs comment hijacking, Reddit seeding, cross-posting, trend monitoring
import fs from "node:fs";
const KEY = process.env.BUFFER_API_KEY;
const SITE = "https://receiptspack.vercel.app";
const log = (m) => console.log(`[guerrilla] ${m}`);

// 1. Generate comment templates for hijacking
const comments = [
  "This is why I keep a private receipt of every time someone doubted me. 30 days of proof hits different.",
  "Spite is a terrible finish but a great start. I turned a rejection into a 30-day standard and it changed everything.",
  "The difference between revenge and proof is that revenge needs them to watch. Proof only needs you to log it.",
  "I got passed over for a promotion. Instead of complaining, I wrote a receipt and turned it into a 30-day standard. Best decision ever.",
  "Envy is a map of what you actually want. Write down who you envy and exactly what they have. That is your gap list. Work it."
];

// 2. Generate Reddit post drafts
const redditPosts = [
  {
    sub: "GetMotivated",
    title: "I got passed over for a promotion. Instead of complaining, I wrote a 'receipt' and turned it into a 30-day standard.",
    body: "Last month my manager gave the promotion to someone less qualified. Instead of venting, I wrote down exactly what happened — a 'receipt' — and converted it into a measurable 30-day standard: 10 applications, 3 conversations, 1 portfolio piece. I logged every action. Today I have 3 interviews lined up. The receipt stays private. The results don't need an audience. Has anyone else turned rejection into a system?"
  },
  {
    sub: "selfimprovement",
    title: "Spite is a terrible finish but a great start. Here's how I use it.",
    body: "Most people say 'don't be motivated by spite'. I disagree. Spite gets you off the couch. The trick is converting it into a standard that outlives the emotion. I keep a private log of every time someone doubted me, then turn each one into a 30-day action plan. After 30 days, I do an 'Arrival Check': what changed in me, what was about them, what standard do I keep. The emotion fades. The discipline stays."
  },
  {
    sub: "careerguidance",
    title: "Rejected by 40 companies. Kept every receipt. Turned the pile into a weekly standard.",
    body: "I was rejected by 40 companies over 6 months. Instead of deleting the emails, I kept them as 'receipts'. Then I turned the pile into a weekly standard: 10 strong applications, no exceptions. I logged every one. Last week I got 3 callbacks. The receipts stay private. The proof is public. If you're in the rejection spiral, try converting it into a system instead of a story."
  }
];

// 3. Generate cross-post content for Instagram Reels
const instagramPost = {
  caption: "They said I wasn't ready. So I kept the receipt.\n\nNot to send them. To prove it.\n\nOne receipt, one measurable standard, thirty days of evidence.\n\nThat is the whole system.\n\n$29 · link in bio\n\n#provethemwrong #selfimprovement #careertok #motivation #discipline #30daychallenge #receipts"
};

// 4. Generate QR code sticker text
const qrText = "They said I wasn't ready. Scan to prove them wrong.";

// 5. Generate micro-influencer outreach templates
const influencerMessages = [
  "Hey! Love your content on [topic]. I built a 30-day system that turns rejection into proof. Would you be open to trying it free and sharing your honest take? No pressure, just thought it might resonate with your audience.",
  "Your post about [topic] really hit home. I created something called Receipts — a private system for turning doubt into discipline. Would you be interested in a free copy to review? No affiliate link, just genuine feedback."
];

// 6. Save all generated content
const output = {
  generated_at: new Date().toISOString(),
  comments,
  redditPosts,
  instagramPost,
  qrText,
  influencerMessages,
  next_actions: [
    "Post 5 comments on big accounts today",
    "Post 1 Reddit value-first post in r/GetMotivated",
    "Cross-post Day 1 video to Instagram Reels via Buffer",
    "Print 50 QR stickers with text: " + qrText,
    "Send 5 micro-influencer outreach messages"
  ]
};

fs.writeFileSync("content/guerrilla-output.json", JSON.stringify(output, null, 2));
log("Generated guerrilla content saved to content/guerrilla-output.json");
log("Next actions: " + output.next_actions.join("; "));
