// one-off: what metrics does Buffer expose per channel / per post? (read-only)
const KEY = process.env.BUFFER_API_KEY;
const gql = async q => (await (await fetch("https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ query: q }) })).json());
const t = async n => ((await gql(`{__type(name:"${n}"){kind fields{name type{name kind ofType{name}}} possibleTypes{name}}}`)).data?.__type);
for (const n of ["ChannelMetadata","PostMetrics","Channel","Post"]) { const x = await t(n); console.log(n, JSON.stringify(x)?.slice(0, 1500)); }
const orgs = (await gql(`{account{organizations{id}}}`)).data.account.organizations;
const o = orgs[0].id;
const ch = (await gql(`{channels(input:{organizationId:"${o}"}){id service metadata{__typename}}}`));
console.log("channels meta", JSON.stringify(ch).slice(0, 1500));
const p = await gql(`{posts(first:6,input:{organizationId:"${o}",filter:{status:[sent]},sort:[{field:createdAt,direction:desc}]}){edges{node{id channelService sentAt externalLink metricsUpdatedAt metrics{__typename}}}}}`);
console.log("posts", JSON.stringify(p).slice(0, 3000));
