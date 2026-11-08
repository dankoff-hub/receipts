import { notFound } from "next/navigation";
import { C, btn, card, eyebrow, h1, h2, sub, link } from "../../theme";
import pages from "../../../content/seo-pages.json";

export function generateStaticParams() {
  return Object.keys(pages.pages || {}).map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const page = pages.pages?.[params.slug];
  if (!page) return { title: "Guide" };
  return { title: page.title, description: page.description };
}

export default function Guide({ params }) {
  const page = pages.pages?.[params.slug];
  if (!page) notFound();
  const related = (page.related || []).map((slug) => pages.pages?.[slug]).filter(Boolean);
  return (
    <main style={{ maxWidth: 680, margin: "0 auto" }}>
      <p style={eyebrow}>Receipts · Guide</p>
      <h1 style={{ ...h1, fontSize: 36, margin: "8px 0 12px" }}>{page.h1}</h1>
      <p style={sub}>{page.description}</p>
      {page.paragraphs.map((p) => (
        <p key={p.slice(0, 24)} style={{ color: C.body, fontSize: 17, lineHeight: 1.6 }}>{p}</p>
      ))}
      <h2 style={h2}>Three steps</h2>
      <ol style={{ ...card, color: C.body, lineHeight: 1.6, paddingLeft: 36 }}>
        {page.steps.map((s) => <li key={s} style={{ margin: "8px 0" }}>{s}</li>)}
      </ol>
      <h2 style={h2}>Questions</h2>
      {page.faq.map((item) => (
        <div key={item.q} style={card}>
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: C.ink }}>{item.q}</p>
          <p style={{ margin: 0, color: C.body }}>{item.a}</p>
        </div>
      ))}
      <p style={{ marginTop: 28 }}>
        <a href={page.cta || `/free?src=seo-${page.slug}`} style={btn}>Start the free receipt log</a>
      </p>
      {related.length > 0 && (
        <>
          <h2 style={h2}>Related guides</h2>
          <ul style={{ paddingLeft: 18 }}>
            {related.map((r) => (
              <li key={r.slug} style={{ margin: "8px 0" }}>
                <a href={`/guides/${r.slug}`} style={link}>{r.h1}</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
