// Shared design tokens. Rationale: long-form reading and purchase decisions test better on light ("positive polarity")
// backgrounds (Piepenbrock, Mayr & Buchner 2013; Buchner & Baumgartner 2007); a single saturated primary colour on a
// neutral page makes the one action obvious (von Restorff isolation effect). Palette = warm paper + ink + deep green +
// amber progress accent. Green reads as "go / trust / money" in Western markets; amber signals progress without alarm.
export const C = {
  bg: "#F6F1E8",        // warm paper
  surface: "#FFFFFF",   // cards
  border: "#E3DBCD",
  ink: "#17161A",
  body: "#3A3732",
  muted: "#6A645B",
  faint: "#8F8880",
  primary: "#0F4C3A",   // deep green CTA
  primaryHover: "#0B3A2D",
  primaryInk: "#FFFFFF",
  accent: "#C77A00",    // amber progress / highlight (4.5:1 on paper for 18px+ bold)
  accentSoft: "#FFF4E0",
  success: "#176B3A",
  danger: "#B42318",
  link: "#0F4C3A",
};
export const F = { head: "var(--font-head), Georgia, serif", body: "var(--font-body), system-ui, sans-serif" };
export const btn = { display: "inline-block", padding: "15px 24px", background: C.primary, color: C.primaryInk, borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 17, letterSpacing: 0.1, boxShadow: "0 1px 0 rgba(0,0,0,.08), 0 6px 18px rgba(15,76,58,.18)" };
export const btnBlock = { ...btn, display: "block", textAlign: "center", margin: "20px 0 8px 0" };
export const btnGhost = { display: "block", padding: "14px 24px", background: C.surface, color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 12, textDecoration: "none", fontWeight: 600, fontSize: 16, textAlign: "center", margin: "8px 0" };
export const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, margin: "12px 0", boxShadow: "0 1px 2px rgba(23,22,26,.04)" };
export const eyebrow = { letterSpacing: 3, fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase" };
export const h1 = { fontFamily: F.head, fontWeight: 600, letterSpacing: -0.3, color: C.ink, lineHeight: 1.12 };
export const h2 = { fontFamily: F.head, fontWeight: 600, fontSize: 26, color: C.ink, margin: "40px 0 12px" };
export const sub = { color: C.body, fontSize: 18, lineHeight: 1.5 };
export const small = { fontSize: 13, color: C.muted };
export const link = { color: C.link, textDecoration: "underline", textUnderlineOffset: 3 };
export const input = { flex: 1, padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.ink, fontSize: 16 };
