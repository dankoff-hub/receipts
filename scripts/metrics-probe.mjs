const KEY = process.env.BUFFER_API_KEY;
const gql = async q => (await (await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query: q }) })).json());
for (const n of ["PostMetric","InstagramMetadata","YoutubeMetadata"]) { const x = (await gql(`{__type(name:"${n}"){fields{name type{name kind ofType{name}}}}}`)).data?.__type; console.log(n, (x?.fields||[]).map(f=>f.name).join(",")); }
const o = (await gql(`{account{organizations{id}}}`)).data.account.organizations[0].id;
const p = await gql(`{posts(first:12,input:{organizationId:"${o}",filter:{status:[sent]},sort:[{field:createdAt,direction:desc}]}){edges{node{id channelService sentAt externalLink metrics{name displayName value}}}}}`);
console.log("METRICS", JSON.stringify(p).slice(0, 6000));
