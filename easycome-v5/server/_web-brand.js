import crypto from 'node:crypto';
import { appOrigin } from './_responses.js';

function secret(){
  const value=String(process.env.EASYCOME_WEB_ASSET_SECRET||process.env.STRIPE_WEBHOOK_SECRET||process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
  if(!value) throw new Error('EASYCOME_WEB_ASSET_SECRET non configurato.');
  return value;
}
function sign(value){return crypto.createHmac('sha256',secret()).update(value).digest('hex')}
function safeEqual(a,b){
  const aa=Buffer.from(String(a||''));const bb=Buffer.from(String(b||''));
  return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);
}

// Google Places photo names are deliberately NOT persisted in Easy Come URLs.
// The URL stores place id + index; web-photo resolves a fresh photo resource name at request time.
export function signedPhotoUrl(req,placeId,index,ttlSeconds=60*60*24*7){
  const place=String(placeId||'').trim();const idx=Math.max(0,Number(index)||0);if(!place)return '';
  const exp=Math.floor(Date.now()/1000)+ttlSeconds;const sig=sign(`photo|${place}|${idx}|${exp}`);
  return `${appOrigin(req)}/api/web-photo?place=${encodeURIComponent(place)}&idx=${idx}&exp=${exp}&sig=${sig}`;
}
export function verifyPhotoToken(placeId,index,exp,sig){
  const place=String(placeId||'').trim();const idx=Math.max(0,Number(index)||0);const e=Number(exp)||0;
  if(!place||!e||e<Math.floor(Date.now()/1000))return false;
  return safeEqual(sign(`photo|${place}|${idx}|${e}`),sig);
}
export function photoCards(req,placeId,photos=[]){
  return (Array.isArray(photos)?photos:[]).slice(0,8).map((p,i)=>({
    id:`google-photo-${i+1}`,
    url:signedPhotoUrl(req,placeId,i),
    attribution:(p?.authorAttributions||[]).map(a=>a?.displayName).filter(Boolean).join(', '),
    source:'google_places'
  })).filter(x=>x.url);
}

export function signedAssetUrl(req,path,ttlSeconds=60*60*24*7){
  const p=String(path||'').trim();if(!p)return '';
  const exp=Math.floor(Date.now()/1000)+ttlSeconds;const sig=sign(`asset|${p}|${exp}`);
  return `${appOrigin(req)}/api/web-brand-asset?path=${encodeURIComponent(p)}&exp=${exp}&sig=${sig}`;
}
export function verifyAssetToken(path,exp,sig){
  const p=String(path||'').trim();const e=Number(exp)||0;if(!p||!e||e<Math.floor(Date.now()/1000))return false;
  return safeEqual(sign(`asset|${p}|${e}`),sig);
}
export function storedAssetCards(req,assets=[]){
  return (Array.isArray(assets)?assets:[]).slice(-8).map((a,i)=>({
    id:`easycome-asset-${i+1}`,
    url:signedAssetUrl(req,a?.path||''),
    attribution:'Asset originale caricato in Easy Come',
    source:'easycome_upload',
    name:String(a?.name||'')
  })).filter(x=>x.url);
}
