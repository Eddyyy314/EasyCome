import crypto from 'node:crypto';
import { authenticatedUser } from '../server/_auth.js';
import { isAdminUser } from '../server/_supabase.js';
import { targetBySlug, updateTarget } from '../server/_demo-store.js';
import { uploadObject, signedObjectUrl } from '../server/_storage.js';
import { signedAssetUrl, verifyAssetToken } from '../server/_web-brand.js';
import { readRaw, json } from '../server/_responses.js';
export const config={api:{bodyParser:false}};
const safeName=v=>String(v||'asset').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100)||'asset';
function query(req,name){try{return String(req.query?.[name]??new URL(req.url||'/','http://localhost').searchParams.get(name)??'').trim()}catch{return String(req.query?.[name]||'').trim()}}
export default async function handler(req,res){
  try{
    if(req.method==='GET'){
      const path=query(req,'path'),exp=query(req,'exp'),sig=query(req,'sig');if(!verifyAssetToken(path,exp,sig)){res.statusCode=403;return res.end('Invalid asset token')}
      const url=await signedObjectUrl(path,300);res.statusCode=302;res.setHeader('location',url);res.setHeader('cache-control','private, max-age=300');return res.end();
    }
    if(req.method!=='POST')return json(res,405,{error:'Metodo non consentito.'});
    const user=await authenticatedUser(req);if(!(await isAdminUser(user.id)))return json(res,403,{error:'Solo admin Easy Come.'});
    const slug=query(req,'d'),name=safeName(query(req,'name')),type=String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase();if(!slug)throw new Error('Prospect non valido.');if(!type.startsWith('image/'))throw new Error('Carica solo immagini.');
    const target=await targetBySlug(slug);if(!target)throw new Error('Prospect non trovato.');const raw=await readRaw(req,10_000_000);if(raw.length<20)throw new Error('Immagine vuota.');if(raw.length>10_000_000)throw new Error('Immagine troppo grande: massimo 10 MB.');
    const ext=(name.match(/\.[a-zA-Z0-9]{2,6}$/)||[''])[0];const hash=crypto.createHash('sha1').update(raw).digest('hex').slice(0,16);const path=`brand-assets/${slug}/${hash}${ext||''}`;await uploadObject(path,raw,type);
    const current=target.demo_config&&typeof target.demo_config==='object'?target.demo_config:{};const prev=Array.isArray(current.websiteBrandAssets)?current.websiteBrandAssets:[];const asset={path,name,type,bytes:raw.length,uploadedAt:new Date().toISOString()};const next=[...prev.filter(a=>a.path!==path),asset].slice(-12);await updateTarget(target.id,{demo_config:{...current,websiteBrandAssets:next}});
    return json(res,200,{ok:true,asset:{...asset,url:signedAssetUrl(req,path)}});
  }catch(e){return json(res,400,{error:e.message||'Asset non disponibile.'})}
}
