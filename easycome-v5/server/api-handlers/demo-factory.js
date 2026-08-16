import crypto from 'node:crypto';
import { requireEasyComeAdmin } from '../_demo-auth.js';
import { textSearch, placeDetails } from '../_google-places.js';
import { seenPlaceIds, createCampaign, insertTargets, recentCampaigns, campaignTargets, markCampaign } from '../_demo-store.js';
import { buildQueryPlan, classifyPlace, buildDemoModel, demoSlug, outreachMessage } from '../_demo-factory-core.js';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function baseUrl(req){return String(process.env.APP_URL||`${req.headers?.['x-forwarded-proto']||'https'}://${req.headers?.host||'easy-come.it'}`).replace(/\/$/,'')}
function publicPlace(place){return {id:place.id||'',name:place.displayName?.text||'Azienda',address:place.formattedAddress||'',website:place.websiteUri||'',phone:place.nationalPhoneNumber||'',category:place.primaryTypeDisplayName?.text||place.primaryType||'Attività',primaryType:place.primaryType||'',types:place.types||[]}}

export default async function handler(req,res){
  try{
    await requireEasyComeAdmin(req);
    if(req.method==='GET'){
      const campaignId=String(req.query?.campaign_id||'').trim();
      if(campaignId){const rows=await campaignTargets(campaignId);return res.status(200).json({targets:rows||[]})}
      const campaigns=await recentCampaigns(16);return res.status(200).json({campaigns:campaigns||[]});
    }
    if(req.method!=='POST')return res.status(405).json({error:'Metodo non consentito.'});
    const action=String(req.body?.action||'generate');
    if(action==='hydrate'){
      const ids=[...new Set((req.body?.placeIds||[]).map(String).filter(Boolean))].slice(0,20);const details=[];
      for(const id of ids){try{details.push(publicPlace(await placeDetails(id)))}catch(e){details.push({id,error:e.message})}}
      return res.status(200).json({places:details});
    }
    if(action!=='generate')return res.status(400).json({error:'Azione non valida.'});
    const limit=Math.max(1,Math.min(100,Number(req.body?.limit)||100));
    const existing=await seenPlaceIds();
    const campaignId=crypto.randomUUID();
    const campaign=await createCampaign({id:campaignId,requested_count:limit,status:'running',source:'google_places',created_at:new Date().toISOString()});
    const plan=buildQueryPlan(`${existing.size}:${campaignId}`,240); const selected=[]; const inBatch=new Set(); const templateCounts=new Map(); const maxPerTemplate=Math.max(2,Math.ceil(limit*0.20)); const perQueryCap=limit<=10?1:2; let queriesRun=0; let rawSeen=0; let failedQueries=0; let firstGoogleError='';
    try{
      const concurrency=6;
      for(let offset=0;offset<plan.length && selected.length<limit;offset+=concurrency){
        const wave=plan.slice(offset,offset+concurrency);
        const settled=await Promise.allSettled(wave.map(query=>textSearch(query,8)));
        queriesRun+=wave.length;
        for(const result of settled){
          if(result.status!=='fulfilled'){ failedQueries++; if(!firstGoogleError) firstGoogleError=String(result.reason?.message||result.reason||'Errore Google Places'); continue; }
          let acceptedFromQuery=0;
          for(const p of result.value.places||[]){
            rawSeen++; if(!p.id||p.businessStatus==='CLOSED_PERMANENTLY'||existing.has(p.id)||inBatch.has(p.id))continue;
            const templateId=classifyPlace(p);
            if((templateCounts.get(templateId)||0)>=maxPerTemplate)continue;
            inBatch.add(p.id); templateCounts.set(templateId,(templateCounts.get(templateId)||0)+1); acceptedFromQuery++;
            const slug=demoSlug(p.id); const model=buildDemoModel(templateId,p.id); const now=new Date(); const expires=new Date(now.getTime()+7*86400000);
            selected.push({place:p, row:{campaign_id:campaignId,place_id:p.id,demo_slug:slug,template_id:templateId,demo_config:model,status:'generated',expires_at:expires.toISOString(),created_at:now.toISOString()}});
            if(selected.length>=limit||acceptedFromQuery>=perQueryCap)break;
          }
          if(selected.length>=limit)break;
        }
        // If every Google request is failing, stop immediately and show the real cause
        // instead of burning through 96 calls and pretending that Google found zero companies.
        if(rawSeen===0 && failedQueries===queriesRun && queriesRun>=concurrency){
          throw new Error(firstGoogleError || 'Google Places non ha restituito alcuna risposta valida. Controlla API key, Places API (New) e fatturazione Google Cloud.');
        }
        if(queriesRun>=96&&selected.length<limit)break;
      }
      await insertTargets(selected.map(x=>x.row));
      await markCampaign(campaignId,{status:selected.length===limit?'completed':'partial',generated_count:selected.length,queries_run:queriesRun,finished_at:new Date().toISOString()});
      const origin=baseUrl(req);
      const targets=selected.map(({place,row})=>{const detail=publicPlace(place);const demoUrl=`${origin}/demo.html?d=${encodeURIComponent(row.demo_slug)}`;return {...detail,id:row.place_id,demoSlug:row.demo_slug,demoUrl,templateId:row.template_id,templateLabel:row.demo_config?.label||row.template_id,expiresAt:row.expires_at,message:outreachMessage(place,demoUrl)}});
      return res.status(200).json({campaign:{...campaign,status:selected.length===limit?'completed':'partial',generated_count:selected.length,queries_run:queriesRun},targets,stats:{requested:limit,generated:selected.length,alreadySeen:existing.size,queriesRun,rawSeen,failedQueries},warning:selected.length<limit?`Trovate ${selected.length} nuove attività prima del limite di sicurezza delle query. Premi di nuovo Genera: i Place ID già usati resteranno esclusi.`:''});
    }catch(error){await markCampaign(campaignId,{status:'failed',generated_count:selected.length,queries_run:queriesRun,finished_at:new Date().toISOString(),error_message:String(error.message||error).slice(0,800)}).catch(()=>{});throw error}
  }catch(error){console.error(error);return res.status(400).json({error:error.message||'Errore Demo Factory.'})}
}
