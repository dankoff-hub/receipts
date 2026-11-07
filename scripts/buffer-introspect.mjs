const KEY=process.env.BUFFER_API_KEY;
const gql=async q=>{const r=await fetch("https://api.buffer.com",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${KEY}`},body:JSON.stringify({query:q})});return r.json()};
const t=async n=>(await gql(`{ __type(name:"${n}"){ name inputFields{ name type{ name kind ofType{ name kind ofType{name}} } } } }`)).data.__type;
const ci=await t("CreatePostInput"); console.log(JSON.stringify(ci.inputFields.map(f=>[f.name,f.type.name||f.type.ofType?.name||f.type.ofType?.ofType?.name]),null,0));
for (const n of ["PostMetadataInput","TikTokPostMetadataInput","TiktokMetadataInput","InstagramPostMetadataInput"]) { const x=await t(n); if(x) console.log(n, JSON.stringify(x.inputFields.map(f=>[f.name,f.type.name||f.type.ofType?.name]))); }
