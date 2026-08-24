import { unzipSync } from 'fflate';
import { authenticatedUser } from '../server/_auth.js';
import { isAdminUser } from '../server/_supabase.js';
import { targetBySlug, updateTarget } from '../server/_demo-store.js';
import { createSignedUpload, downloadObject, signedObjectUrl, uploadObject } from '../server/_storage.js';
import { readJson, json, appOrigin } from '../server/_responses.js';
export const config={api:{bodyParser:false}};

const MAX_ZIP_BYTES=50*1024*1024;
const MAX_FILES=700;
const MAX_UNPACKED_BYTES=80*1024*1024;
const clean=v=>String(v||'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'site.zip';
function query(req,name){try{return String(req.query?.[name]??new URL(req.url||'/','http://localhost').searchParams.get(name)??'').trim()}catch{return String(req.query?.[name]||'').trim()}}
function safePath(v){
  let p=decodeURIComponent(String(v||'')).replace(/\\/g,'/').replace(/^\/+/, '');
  p=p.split('/').filter(Boolean).join('/');
  if(!p||p==='.')return 'index.html';
  if(p.includes('..')||p.includes('\0'))throw new Error('Percorso non valido.');
  return p;
}
function mime(path=''){
  const ext=(String(path).toLowerCase().match(/\.([a-z0-9]+)$/)||[])[1]||'';
  return ({html:'text/html; charset=utf-8',htm:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',json:'application/json; charset=utf-8',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif',ico:'image/x-icon',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',pdf:'application/pdf',txt:'text/plain; charset=utf-8',xml:'application/xml; charset=utf-8',webmanifest:'application/manifest+json'})[ext]||'application/octet-stream';
}
function isText(path=''){return /\.(?:html?|css|js|mjs|json|svg|txt|xml|webmanifest)$/i.test(path)}
function zipEntries(raw){
  let unpacked;try{unpacked=unzipSync(new Uint8Array(raw))}catch{throw new Error('ZIP non leggibile. Scarica di nuovo il pacchetto completo dal generatore.');}
  const entries=[];let total=0;
  for(const [name,data] of Object.entries(unpacked)){
    const normalized=String(name||'').replace(/\\/g,'/').replace(/^\/+/, '');
    if(!normalized||normalized.endsWith('/')||normalized.startsWith('__MACOSX/')||normalized.includes('/.git/')||normalized.includes('/node_modules/'))continue;
    if(normalized.split('/').some(x=>x==='..'))throw new Error('ZIP non sicuro: contiene percorsi non validi.');
    total+=data.length;if(total>MAX_UNPACKED_BYTES)throw new Error('Pacchetto troppo grande dopo l’estrazione.');
    entries.push({name:normalized,data});if(entries.length>MAX_FILES)throw new Error(`Pacchetto troppo complesso: massimo ${MAX_FILES} file pubblicabili.`);
  }
  if(!entries.length)throw new Error('ZIP vuoto.');
  return entries;
}
function chooseSite(entries){
  const names=new Set(entries.map(x=>x.name));const indexes=entries.filter(x=>/(^|\/)index\.html?$/i.test(x.name));
  if(!indexes.length)throw new Error('Non trovo index.html. In AI Studio esegui il Production Pass e scarica il progetto completo con la build statica.');
  const score=name=>{const n=name.toLowerCase();if(/(^|\/)dist\/index\.html$/.test(n))return 100;if(/(^|\/)build\/index\.html$/.test(n))return 95;if(/(^|\/)out\/index\.html$/.test(n))return 90;if(n==='index.html')return 80;return 60};
  indexes.sort((a,b)=>score(b.name)-score(a.name));const chosen=indexes[0];const root=chosen.name.slice(0,chosen.name.length-chosen.name.split('/').pop().length).replace(/\/$/,'');
  const rootPrefix=root?root+'/':'';const site=entries.filter(x=>!root||x.name.startsWith(rootPrefix)).map(x=>({name:root?x.name.slice(rootPrefix.length):x.name,data:x.data})).filter(x=>x.name&&!x.name.startsWith('.'));
  const index=site.find(x=>/^index\.html?$/i.test(x.name));if(!index)throw new Error('Build non valida: index.html non è nella cartella pubblicabile.');
  const indexText=Buffer.from(index.data).toString('utf8');
  if((names.has('package.json')||entries.some(x=>/(^|\/)package\.json$/.test(x.name)))&&(/\/src\/(?:main|index)\.[jt]sx?/i.test(indexText)||/<script[^>]+src=["']\/src\//i.test(indexText))){
    throw new Error('Hai caricato i sorgenti, non la build finale. In AI Studio lancia il Production Pass, esegui la build e verifica che nello ZIP esista dist/index.html.');
  }
  return{root:root||'.',files:site,indexText};
}
async function validateProposal(slug,token){
  const target=await targetBySlug(slug);if(!target)throw new Error('Prospect non trovato.');
  const current=target.demo_config&&typeof target.demo_config==='object'?target.demo_config:{};const proposal=current.webProposal||{};
  if(!proposal.token||proposal.token!==token)throw new Error('Proposta non valida.');
  if(proposal.expiresAt&&new Date(proposal.expiresAt).getTime()<Date.now()&&proposal.status!=='paid')throw new Error('Proposta scaduta.');
  return{target,current,proposal};
}
async function uploadMany(base,files){
  let cursor=0;const workers=Array.from({length:Math.min(8,files.length)},async()=>{while(cursor<files.length){const i=cursor++;const f=files[i];await uploadObject(`${base}/${f.name}`,Buffer.from(f.data),mime(f.name));}});await Promise.all(workers);
}
export default async function handler(req,res){
  try{
    const mode=query(req,'mode')||'prepare';const slug=query(req,'d'),token=query(req,'t');if(!slug||!token)throw new Error('Proposta non valida.');
    if(req.method==='GET'){
      const {proposal}=await validateProposal(slug,token);
      if(mode==='download'){
        if(proposal.status!=='paid')return json(res,403,{error:'Il pacchetto diventa scaricabile dopo l’acquisto.'});
        if(!proposal.packagePath)return json(res,404,{error:'Pacchetto non disponibile.'});
        const signed=await signedObjectUrl(proposal.packagePath,300);const sep=signed.includes('?')?'&':'?';res.statusCode=302;res.setHeader('location',`${signed}${sep}download=${encodeURIComponent(proposal.packageName||'easycome-web.zip')}`);res.setHeader('cache-control','no-store');return res.end();
      }
      if(mode==='file'){
        if(!proposal.siteBasePath)return json(res,404,{error:'Portale sito non ancora pronto.'});
        let rel=safePath(query(req,'p')||'index.html');if(rel.endsWith('/'))rel+='index.html';
        let objectPath=`${proposal.siteBasePath}/${rel}`;let found;
        try{found=await downloadObject(objectPath)}catch(e){if(!/\.[a-z0-9]{1,8}$/i.test(rel)){rel='index.html';objectPath=`${proposal.siteBasePath}/${rel}`;found=await downloadObject(objectPath)}else throw e}
        const type=mime(rel);if(!isText(rel)||found.bytes.length>3_500_000){const signed=await signedObjectUrl(objectPath,600);res.statusCode=302;res.setHeader('location',signed);res.setHeader('cache-control','private, max-age=300');return res.end();}
        res.statusCode=200;res.setHeader('content-type',type);res.setHeader('cache-control',/\.html?$/i.test(rel)?'private, no-store':'private, max-age=300');res.setHeader('x-frame-options','SAMEORIGIN');res.setHeader('access-control-allow-origin','*');if(/\.html?$/i.test(rel)){res.setHeader('content-security-policy',"sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads; base-uri 'none'; object-src 'none'");res.setHeader('referrer-policy','no-referrer');}return res.end(found.bytes);
      }
      return json(res,400,{error:'Modalità non valida.'});
    }
    if(req.method!=='POST')return json(res,405,{error:'Metodo non consentito.'});
    const user=await authenticatedUser(req);if(!(await isAdminUser(user.id)))return json(res,403,{error:'Solo admin Easy Come.'});
    const {target,current,proposal}=await validateProposal(slug,token);const body=await readJson(req,350_000);
    if(mode==='prepare'){
      const filename=clean(body.filename||'site.zip');const size=Number(body.size||0);if(!/\.zip$/i.test(filename))throw new Error('Carica un file ZIP.');if(size<100)throw new Error('Pacchetto vuoto.');if(size>MAX_ZIP_BYTES)throw new Error('Pacchetto troppo grande: massimo 50 MB.');
      const path=`projects/${slug}/${token}/source/${Date.now()}-${filename}`;const signed=await createSignedUpload(path);const next={...proposal,uploadPending:true,packageName:filename,packageBytes:size,packagePath:path,updatedAt:new Date().toISOString()};await updateTarget(target.id,{demo_config:{...current,webProposal:next}});return json(res,200,{ok:true,upload:signed,proposal:next});
    }
    if(mode==='finalize'){
      const path=String(body.path||proposal.packagePath||'').trim();if(!path.startsWith(`projects/${slug}/${token}/source/`))throw new Error('Pacchetto Easy Come non valido.');
      const source=await downloadObject(path);if(source.bytes.length>MAX_ZIP_BYTES)throw new Error('Pacchetto troppo grande.');const entries=zipEntries(source.bytes);const site=chooseSite(entries);
      const siteBasePath=`projects/${slug}/${token}/site-v${Date.now()}`;await uploadMany(siteBasePath,site.files);
      const origin=appOrigin(req);const hostedPreviewUrl=`${origin}/web-sites/${encodeURIComponent(slug)}/${encodeURIComponent(token)}/`;
      const next={...proposal,packagePath:path,packageName:proposal.packageName||clean(path.split('/').pop()),packageBytes:source.bytes.length,packageUploadedAt:new Date().toISOString(),uploadPending:false,status:proposal.status==='paid'?'paid':'ready',previewMode:'easycome-hosted',previewUrl:hostedPreviewUrl,hostedPreviewUrl,siteBasePath,siteRoot:site.root,siteFileCount:site.files.length,sitePublishedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      await updateTarget(target.id,{demo_config:{...current,webProposal:next}});return json(res,200,{ok:true,proposal:next,hostedPreviewUrl});
    }
    return json(res,400,{error:'Modalità non valida.'});
  }catch(e){return json(res,400,{error:e.message||'Importazione non riuscita.'})}
}
