// Build a partner's pack link. Usage: PARTNER_PACK_SECRET=… node scripts/partner-grant.mjs <code>
// The sender keeps the secret outside the repo (sandbox: ~/.config/receipts/partner.key). Never print the secret.
import crypto from "node:crypto";
const code = String(process.argv[2] || "").toLowerCase(), s = process.env.PARTNER_PACK_SECRET;
if (!s || !/^[a-z0-9]{2,24}$/.test(code)) { console.error("usage: PARTNER_PACK_SECRET=… node scripts/partner-grant.mjs <code>"); process.exit(1); }
const k = crypto.createHmac("sha256", s).update("partner:" + code).digest("hex").slice(0, 16);
console.log(`https://receiptspack.vercel.app/pack?partner=${code}&k=${k}`);
console.log(`partner link: https://receiptspack.vercel.app/p/${code}`);
