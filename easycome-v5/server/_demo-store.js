function cfg(){const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');const key=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'');if(!url||!key)throw new Error('Supabase non configurato per Demo Factory.');return{url,key}}
async function req(path,options={}){const {url,key}=cfg();const r=await fetch(`${url}/rest/v1/${path}`,{...options,headers:{apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json',prefer:options.prefer||'return=representation',...(options.headers||{})}});if(!r.ok)throw new Error(`Supabase ${r.status}: ${await r.text()}`);if(r.status===204)return null;return r.json()}
export async function seenPlaceIds(){
  const seen=new Set();
  for(let offset=0;offset<100000;offset+=1000){
    const rows=await req(`easycome_demo_targets?select=place_id&order=created_at.asc&limit=1000&offset=${offset}`);
    for(const row of rows||[]) if(row.place_id) seen.add(row.place_id);
    if(!rows||rows.length<1000) break;
  }
  return seen;
}
export async function createCampaign(row){const out=await req('easycome_demo_campaigns',{method:'POST',body:JSON.stringify(row)});return Array.isArray(out)?out[0]:out}
export async function insertTargets(rows){if(!rows.length)return[];return req('easycome_demo_targets',{method:'POST',body:JSON.stringify(rows),headers:{prefer:'return=representation'}})}
export async function campaignTargets(campaignId){return req(`easycome_demo_targets?campaign_id=eq.${encodeURIComponent(campaignId)}&select=*&order=created_at.asc`)}
export async function recentCampaigns(limit=200){return req(`easycome_demo_campaigns?select=*&order=created_at.desc&limit=${Math.max(1,Math.min(500,Number(limit)||200))}`)}
export async function targetBySlug(slug){const rows=await req(`easycome_demo_targets?demo_slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`);return rows?.[0]||null}
export async function targetById(id){const rows=await req(`easycome_demo_targets?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);return rows?.[0]||null}
export async function updateTarget(id,patch){return req(`easycome_demo_targets?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(patch),prefer:'return=minimal'})}
export async function markCampaign(id,patch){return req(`easycome_demo_campaigns?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(patch),prefer:'return=minimal'})}
