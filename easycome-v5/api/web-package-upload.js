import { authenticatedUser } from '../server/_auth.js';
import { isAdminUser } from '../server/_supabase.js';
import { targetBySlug, updateTarget } from '../server/_demo-store.js';
import { uploadObject } from '../server/_storage.js';
import { readRaw, json } from '../server/_responses.js';
export const config={api:{bodyParser:false}};
const clean=v=>String(v||'').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(0,120)||'site.zip';
export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Metodo non consentito.'});
  try{
    const user=await authenticatedUser(req);if(!(await isAdminUser(user.id)))return json(res,403,{error:'Solo admin Easy Come.'});
    const u=new URL(req.url||'/api/web-package-upload','http://localhost');const slug=String(req.query?.d||u.searchParams.get('d')||'').trim();const token=String(req.query?.t||u.searchParams.get('t')||'').trim();const filename=clean(req.query?.name||u.searchParams.get('name')||'site.zip');
    const target=await targetBySlug(slug);if(!target)throw new Error('Prospect non trovato.');const current=target.demo_config&&typeof target.demo_config==='object'?target.demo_config:{};const proposal=current.webProposal||{};if(!proposal.token||proposal.token!==token)throw new Error('Proposta non valida.');
    const raw=await readRaw(req,15_000_000);if(raw.length<50)throw new Error('Pacchetto vuoto.');if(raw.length>15_000_000)throw new Error('Pacchetto troppo grande: massimo 15 MB.');
    const path=`${slug}/${token}/${filename}`;await uploadObject(path,raw,req.headers['content-type']||'application/zip');
    const next={...proposal,packagePath:path,packageName:filename,packageBytes:raw.length,packageUploadedAt:new Date().toISOString(),status:proposal.status==='draft'?'ready':proposal.status};
    await updateTarget(target.id,{demo_config:{...current,webProposal:next}});return json(res,200,{ok:true,proposal:next});
  }catch(e){return json(res,400,{error:e.message||'Upload non riuscito.'})}
}
