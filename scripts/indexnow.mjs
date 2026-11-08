#!/usr/bin/env node
// Ping IndexNow (free, no account, no card) so new guide URLs can be discovered.
// Key file must already be deployed at https://receiptspack.vercel.app/<key>.txt
import fs from "node:fs";

const HOST = "receiptspack.vercel.app";
const KEY = "b7e4c91a6d2f4083";
const pages = JSON.parse(fs.readFileSync("content/seo-pages.json", "utf8")).pages || {};
const urls = ["https://" + HOST + "/", "https://" + HOST + "/free", "https://" + HOST + "/card", "https://" + HOST + "/guides", ...Object.keys(pages).map(s => `https://${HOST}/guides/${s}`)].slice(0, 100);
const body = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls };
const r = await fetch("https://api.indexnow.org/indexnow", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
console.log("indexnow", r.status, "urls", urls.length);
if (r.status >= 400) console.log(await r.text().catch(() => ""));
process.exit(0);
