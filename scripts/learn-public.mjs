#!/usr/bin/env node
// One public page per run. Stores an original one-line pattern plus the URL. Does not copy the source paragraph.
import fs from "node:fs";

const TOPICS = ["Self-discipline", "Habit", "Stoicism", "Goal_setting", "Practice_(learning_method)"];
const day = Number(new Date().toISOString().slice(8, 10));
const topic = TOPICS[day % TOPICS.length];
const url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(topic);
const OUT = "content/library-notes.json";
const notes = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
if (notes.some((n) => n.topic === topic && n.date === new Date().toISOString().slice(0, 10))) {
  console.log("learn skip", topic);
  process.exit(0);
}
const r = await fetch(url, { headers: { "user-agent": "ReceiptsLearn/1.0 (https://receiptspack.vercel.app)", "api-user-agent": "ReceiptsLearn/1.0 (https://receiptspack.vercel.app)" } });
if (!r.ok) { console.log("learn fetch", r.status); process.exit(0); }
const j = await r.json();
const extract = String(j.extract || "");
const words = extract.split(/\s+/).filter((w) => w.length > 5).slice(0, 4);
const pattern = `A person keeps a standard by repeating one small action until it is ordinary. Angle for today: ${topic.replace(/_/g, " ").toLowerCase()} — use the idea, not a quote.`;
if (/guarantee|refund|earn \$|make \$/.test(pattern)) process.exit(0);
notes.push({
  date: new Date().toISOString().slice(0, 10),
  topic,
  source: j.content_urls?.desktop?.page || url,
  pattern,
  cue: words.join(" ").slice(0, 80),
});
fs.writeFileSync(OUT, JSON.stringify(notes.slice(-30), null, 1) + "\n");
console.log("learn wrote", topic, "notes", notes.length);
