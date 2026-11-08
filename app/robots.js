export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://receiptspack.vercel.app/sitemap.xml",
  };
}
