import { targetBySlug, updateTarget } from '../_demo-store.js';
import { placeDetails } from '../_google-places.js';
import { buildDemoModel, buildProject, templateFor, demoPrice } from '../_demo-factory-core.js';
import { ECGenerator } from '../_generator-node.js';

function cleanPlace(p){return{name:p.displayName?.text||'La tua attività',address:p.formattedAddress||'',website:p.websiteUri||'',category:p.primaryTypeDisplayName?.text||p.primaryType||'Attività',primaryType:p.primaryType||'',placeId:p.id||'',types:p.types||[]}}
function rawFromSnapshot(s={}){return{id:s.id||'',displayName:{text:s.name||'La tua attività'},formattedAddress:s.address||'',primaryType:s.primaryType||'',primaryTypeDisplayName:{text:s.category||s.primaryType||'Attività'},types:s.types||[]}}
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Metodo non consentito.'});
  try{
    const slug=String(req.query?.slug||req.query?.d||'').trim();if(!slug)throw new Error('Demo non valida.');
    const target=await targetBySlug(slug);if(!target) return res.status(404).json({error:'Demo non trovata.'});
    if(target.expires_at&&new Date(target.expires_at).getTime()<Date.now())return res.status(410).json({error:'Questa demo è scaduta. Contatta Easy Come per riattivarla.'});
    const snapshot=target.demo_config?.placeSnapshot;
    const raw=snapshot?.name ? rawFromSnapshot(snapshot) : await placeDetails(target.place_id);
    const place=cleanPlace(raw); const model=target.demo_config||buildDemoModel(target.template_id,target.place_id); const t=templateFor(target.template_id);
    const count=Number(target.view_count||0)+1;updateTarget(target.id,{view_count:count,last_viewed_at:new Date().toISOString()}).catch(()=>{});
    const project=buildProject(raw,target.template_id,'');
    const price=Number(target.demo_config?.quotedPrice||demoPrice(raw,target.template_id));
    // Keep the Studio starting total identical to the price shown in the demo.
    // From that exact starting configuration, adding/removing modules changes the total normally.
    const rawProjectTotal=Number(ECGenerator.calculatePrice(project).total||99);
    project.delivery.packagePrice=Math.max(0,Number(project.delivery.packagePrice||99)+(price-rawProjectTotal));
    project.demoSource={...(project.demoSource||{}),quotedPrice:price,slug};
    res.setHeader('cache-control','private, no-store, max-age=0');
    return res.status(200).json({slug,place,model,project,price,startingPrice:99,expiresAt:target.expires_at,views:count,templateLabel:t.label,googleMapsAttribution:true});
  }catch(error){console.error(error);return res.status(400).json({error:error.message||'Errore caricamento demo.'})}
}
