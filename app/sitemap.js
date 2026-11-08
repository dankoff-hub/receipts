import pages from "../content/seo-pages.json";

const BASE = "https://receiptspack.vercel.app";

export default function sitemap() {
  const slugs = Object.keys(pages.pages || {});
  const paths = ["/", "/free", "/card", "/pricing", "/guides", "/partners", ...slugs.map((s) => `/guides/${s}`)];
  return paths.map((p) => ({ url: `${BASE}${p === "/" ? "" : p}`, lastModified: new Date() }));
}
