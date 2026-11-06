#!/usr/bin/env node
// Prints Buffer channel health (connection/lock status) + last TikTok posts with error text. Read-only. No secrets printed.
const KEY = process.env.BUFFER_API_KEY;
const gql = async q => { const r = await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query: q }) }); const j = await r.json(); return j; };
// introspect Channel type fields so we see every status-like field Buffer exposes
const t = await gql(`{__type(name:"Channel"){fields{name type{name kind ofType{name}}}}}`);
const fields = (t.data?.__type?.fields || []).map(f => f.name);
console.log("Channel fields:", fields.join(", "));
const want = ["id","name","service","isDisconnected","isLocked","isQueuePaused","displayName","serviceId","type","createdAt"].filter(f => fields.includes(f));
const orgs = (await gql(`{account{organizations{id name}}}`)).data.account.organizations;
for (const o of orgs) {
  const r = await gql(`{channels(input:{organizationId:"${o.id}"}){${want.join(" ")}}}`);
  console.log(JSON.stringify(r, null, 1));
  const tk = (r.data?.channels || []).find(c => c.service.toLowerCase() === "tiktok");
  if (tk) {
    const pf = await gql(`{__type(name:"Post"){fields{name}}}`);
    console.log("Post fields:", (pf.data?.__type?.fields||[]).map(f=>f.name).join(", "));
    const p = await gql(`{posts(first:10,input:{organizationId:"${o.id}",filter:{channelIds:["${tk.id}"]},sort:[{field:createdAt,direction:desc}]}){edges{node{id status dueAt sentAt createdAt error{message} notificationStatus}}}}`);
    if (p.errors) { const p2 = await gql(`{posts(first:10,input:{organizationId:"${o.id}",filter:{channelIds:["${tk.id}"]},sort:[{field:createdAt,direction:desc}]}){edges{node{id status dueAt sentAt createdAt error{message}}}}}`); console.log("TikTok posts:", JSON.stringify(p2, null, 1).slice(0, 5000)); }
    else console.log("TikTok posts:", JSON.stringify(p, null, 1).slice(0, 5000));
    console.log("TikTok posts:", JSON.stringify(p, null, 1).slice(0, 4000));
  }
}

// ---- auto-pause: if the newest TikTok post errored with an account ban, pause TikTok for 3 days (re-probe after)
import fs from "node:fs";
const cfgPath = "content/audience-config.json";
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
cfg.paused ??= {};
for (const o of orgs) {
  const chans = (await gql(`{channels(input:{organizationId:"${o.id}"}){id service isDisconnected isLocked}}`)).data?.channels || [];
  for (const ch of chans) {
    const svc = ch.service.toLowerCase();
    const p = await gql(`{posts(first:1,input:{organizationId:"${o.id}",filter:{channelIds:["${ch.id}"]},sort:[{field:createdAt,direction:desc}]}){edges{node{status error{message} createdAt}}}}`);
    const last = p.data?.posts?.edges?.[0]?.node;
    const banned = last?.status === "error" && /bann|suspend|disabled/i.test(last.error?.message || "");
    if (banned || ch.isDisconnected || ch.isLocked) {
      const until = new Date(Date.now() + 3 * 864e5).toISOString();
      cfg.paused[svc] = { until, reason: banned ? `Buffer error: ${last.error.message}` : (ch.isDisconnected ? "channel disconnected in Buffer" : "channel locked in Buffer") };
      console.log(`AUTO-PAUSE ${svc} until ${until}: ${cfg.paused[svc].reason}`);
    } else if (cfg.paused[svc] && last?.status === "sent") {
      delete cfg.paused[svc]; console.log(`UNPAUSE ${svc}: last post sent OK`);
    }
  }
}
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 1));
