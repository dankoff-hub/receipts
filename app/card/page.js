import Maker from "./Maker";
import { eyebrow, h1 } from "../theme";

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 140);

export function generateMetadata({ searchParams }) {
  const line = clean(searchParams?.line) || "You are not ready.";
  const title = `Receipt: ${line.slice(0, 60)}`;
  const img = "https://receiptspack.vercel.app/card/og?line=" + encodeURIComponent(line);
  return {
    title,
    description: "A private receipt. Keep the line, then spend 30 days making it irrelevant.",
    openGraph: { title, images: [img] },
  };
}

export default function CardPage({ searchParams }) {
  const line = clean(searchParams?.line);
  return (
    <main>
      <p style={eyebrow}>Receipts · shareable card</p>
      <h1 style={{ ...h1, fontSize: 36, marginTop: 8 }}>Keep the line. Don’t answer it.</h1>
      <Maker initial={line} />
    </main>
  );
}
