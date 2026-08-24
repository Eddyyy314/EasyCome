import { authenticatedUser } from '../server/_auth.js';
import { isAdminUser } from '../server/_supabase.js';
import { targetBySlug } from '../server/_demo-store.js';
import { readJson, json, appOrigin } from '../server/_responses.js';
import { createZipBytes } from '../server/_zip-node.js';

const MAX_ASSET=10*1024*1024,MAX_TOTAL=42*1024*1024;
function extFor(type=''){const t=String(type).toLowerCase();if(t.includes('png'))return'png';if(t.includes('webp'))return'webp';if(t.includes('gif'))return'gif';if(t.includes('avif'))return'avif';if(t.includes('svg'))return'svg';return'jpg'}
function safe(v){return String(v||'asset').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,50)||'asset'}
export default async function handler(req,res){
  try{
    if(req.method!=='POST')return json(res,405,{error:'Metodo non consentito.'});
    const user=await authenticatedUser(req);if(!(await isAdminUser(user.id)))return json(res,403,{error:'Solo admin Easy Come.'});
    const body=await readJson(req,300_000),slug=String(body.demoSlug||'').trim(),prompt=String(body.prompt||'').trim();if(!slug||!prompt)throw new Error('Handoff incompleto.');
    const target=await targetBySlug(slug);if(!target)throw new Error('Prospect non trovato.');
    const manifest=(Array.isArray(body.imageManifest)?body.imageManifest:[]).slice(0,12),origin=appOrigin(req),files=[{name:'MASTER-PROMPT.md',data:prompt}],packed=[];let total=0;
    for(let i=0;i<manifest.length;i++){
      const a=manifest[i],raw=String(a?.url||'').trim();if(!raw)continue;let u;try{u=new URL(raw)}catch{continue}if(u.origin!==origin||!['/api/web-photo','/api/web-brand-asset'].includes(u.pathname))continue;
      try{const r=await fetch(u.href,{redirect:'follow'});if(!r.ok)continue;const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length<20||bytes.length>MAX_ASSET||total+bytes.length>MAX_TOTAL)continue;total+=bytes.length;const ext=extFor(r.headers.get('content-type')||''),name=`assets/ASSET_${String(i+1).padStart(2,'0')}_${safe(a.role||a.name||'asset')}.${ext}`;files.push({name,data:bytes});packed.push({id:`ASSET_${String(i+1).padStart(2,'0')}`,filename:name,role:String(a.role||''),name:String(a.name||''),source:String(a.source||''),originalUrl:raw})}catch{}
    }
    files.splice(1,0,{name:'ASSET-MANIFEST.json',data:JSON.stringify({easycome:'V38',business:target?.demo_config?.placeSnapshot?.name||'',assets:packed},null,2)},{name:'LEGGIMI.txt',data:'1) Copia il Master Prompt da Easy Come (è anche in MASTER-PROMPT.md).\n2) Apri ChatGPT o la chat che preferisci.\n3) Allega questo Creative Pack ZIP.\n4) Incolla il prompt e chiedi di creare davvero il sito + ZIP finale.\n5) Reimporta lo ZIP finale in Easy Come.\n'});
    const zip=createZipBytes(files),filename=`${safe(target?.demo_config?.placeSnapshot?.name||slug)}-creative-pack.zip`;res.statusCode=200;res.setHeader('content-type','application/zip');res.setHeader('content-disposition',`attachment; filename="${filename}"`);res.setHeader('cache-control','no-store');res.setHeader('x-easycome-handoff','V38');return res.end(Buffer.from(zip));
  }catch(e){return json(res,400,{error:e.message||'Creative Pack non disponibile.'})}
}
