import { Fraunces, Inter } from "next/font/google";
import { C } from "./theme";
const head = Fraunces({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-head", display: "swap" });
const body = Inter({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-body", display: "swap" });
export const metadata = { title: "Receipts — Turn doubt into a standard", description: "A private system that turns rejection into a 30-day standard." };
export const viewport = { themeColor: "#F6F1E8" };
export default function L({ children }) {
  return <html lang="en" className={`${head.variable} ${body.variable}`}>
    <body style={{ fontFamily: "var(--font-body), system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: 24, background: C.bg, color: C.ink, lineHeight: 1.55, WebkitFontSmoothing: "antialiased" }}>
      <style>{`html{background:${C.bg}} a{color:${C.link}} b,strong{color:${C.ink}} h1,h2,h3{font-family:var(--font-head),Georgia,serif;font-weight:600;color:${C.ink}} input::placeholder{color:${C.faint}} a[style*="background: rgb(15, 76, 58)"]:hover{background:${C.primaryHover}!important} @media (max-width:480px){body{padding:16px}}`}</style>
      {children}
    </body></html>;
}
