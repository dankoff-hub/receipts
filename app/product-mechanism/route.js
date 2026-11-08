import mechanism from "../../content/product-mechanism.json";

export function GET() {
  return Response.json(mechanism, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
