import { verifyPhotoToken } from '../server/_web-brand.js';
import { placeDetails } from '../server/_google-places.js';
export const config={api:{bodyParser:false}};
function key(){const k=String(process.env.GOOGLE_PLACES_API_KEY||'').trim();if(!k)throw new Error('GOOGLE_PLACES_API_KEY mancante.');return k}
export default async function handler(req,res){
  try{
    if(req.method!=='GET'){res.statusCode=405;return res.end('Method not allowed')}
    const u=new URL(req.url||'/api/web-photo','http://localhost');
    const place=String(req.query?.place||u.searchParams.get('place')||'');const idx=Number(req.query?.idx??u.searchParams.get('idx')??0)||0;const exp=String(req.query?.exp||u.searchParams.get('exp')||'');const sig=String(req.query?.sig||u.searchParams.get('sig')||'');
    if(!verifyPhotoToken(place,idx,exp,sig)){res.statusCode=403;return res.end('Invalid photo token')}
    const detail=await placeDetails(place);const photo=(Array.isArray(detail?.photos)?detail.photos:[])[idx];const name=String(photo?.name||'').trim();if(!name)throw new Error('Foto non più disponibile.');
    const media=`https://places.googleapis.com/v1/${name.replace(/^\/+/, '')}/media?maxWidthPx=1600&key=${encodeURIComponent(key())}`;
    let r=await fetch(media,{redirect:'follow'});if(!r.ok)throw new Error(`Google Photo ${r.status}`);
    const type=r.headers.get('content-type')||'image/jpeg';
    if(type.includes('application/json')){const d=await r.json();if(!d.photoUri)throw new Error('Photo URI mancante');r=await fetch(d.photoUri);if(!r.ok)throw new Error(`Photo fetch ${r.status}`)}
    const bytes=Buffer.from(await r.arrayBuffer());res.statusCode=200;res.setHeader('content-type',r.headers.get('content-type')||'image/jpeg');res.setHeader('cache-control','private, max-age=900');res.end(bytes);
  }catch(e){res.statusCode=400;res.end(e.message||'Photo error')}
}
