import { createClient } from '@supabase/supabase-js';

function cfg(){
  const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'');
  if(!url||!key)throw new Error('Supabase Storage non configurato.');
  return{url,key};
}
export function storageBucket(){return String(process.env.SUPABASE_WEB_BUCKET||'easycome-web-projects')}
function serviceClient(){const {url,key}=cfg();return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})}
async function ensureBucket(bucket){
  const {url,key}=cfg();
  const headers={apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json'};
  const check=await fetch(`${url}/storage/v1/bucket/${encodeURIComponent(bucket)}`,{headers});
  if(check.ok)return;
  const create=await fetch(`${url}/storage/v1/bucket`,{method:'POST',headers,body:JSON.stringify({id:bucket,name:bucket,public:false,file_size_limit:52428800})});
  if(!create.ok&&!String(await create.text()).toLowerCase().includes('already'))throw new Error(`Storage bucket ${create.status}`);
}
export async function uploadObject(path,bytes,contentType='application/octet-stream'){
  const {url,key}=cfg();const bucket=storageBucket();await ensureBucket(bucket);
  const safe=String(path||'').split('/').map(encodeURIComponent).join('/');
  const r=await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${safe}`,{method:'POST',headers:{apikey:key,authorization:`Bearer ${key}`,'content-type':contentType,'x-upsert':'true'},body:bytes});
  if(!r.ok)throw new Error(`Storage ${r.status}: ${await r.text()}`);return{bucket,path};
}
export async function createSignedUpload(path){
  const bucket=storageBucket();await ensureBucket(bucket);const supabase=serviceClient();
  const {data,error}=await supabase.storage.from(bucket).createSignedUploadUrl(path,{upsert:true});
  if(error||!data?.token)throw new Error(error?.message||'Impossibile preparare upload diretto.');
  return{bucket,path,token:data.token,signedUrl:data.signedUrl||data.signedURL||''};
}
export async function downloadObject(path){
  const {url,key}=cfg();const bucket=storageBucket();await ensureBucket(bucket);
  const safe=String(path||'').split('/').map(encodeURIComponent).join('/');
  const r=await fetch(`${url}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${safe}`,{headers:{apikey:key,authorization:`Bearer ${key}`}});
  if(!r.ok)throw new Error(`Storage download ${r.status}: ${await r.text()}`);
  return{bytes:Buffer.from(await r.arrayBuffer()),contentType:r.headers.get('content-type')||'application/octet-stream'};
}
export async function signedObjectUrl(path,expiresIn=3600){
  const {url,key}=cfg();const bucket=storageBucket();
  const safe=String(path||'').split('/').map(encodeURIComponent).join('/');
  const r=await fetch(`${url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${safe}`,{method:'POST',headers:{apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json'},body:JSON.stringify({expiresIn})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`Storage sign ${r.status}: ${d.message||JSON.stringify(d)}`);
  const signed=d.signedURL||d.signedUrl||'';return signed?`${url}/storage/v1${signed}`:'';
}
