import { C, eyebrow, h1, sub, link, card } from "../theme";
import pages from "../../content/seo-pages.json";

export const metadata = {
  title: "Guides · Receipts Pack",
  description: "Short guides on private rejection logs, 30-day proof, and a standard you can keep.",
};

export default function Guides() {
  const list = Object.values(pages.pages || {});
  return (
    <main style={{ maxWidth: 680, margin: "0 auto" }}>
      <p style={eyebrow}>Receipts · Guides</p>
      <h1 style={{ ...h1, fontSize: 36, margin: "8px 0 12px" }}>Guides</h1>
      <p style={sub}>Private notes and 30-day standards after a no. Step 1 is free.</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {list.map((p) => (
          <li key={p.slug} style={card}>
            <a href={`/guides/${p.slug}`} style={{ ...link, fontWeight: 700, fontSize: 18 }}>{p.h1}</a>
            <p style={{ margin: "8px 0 0", color: C.body }}>{p.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
