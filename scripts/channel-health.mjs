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
