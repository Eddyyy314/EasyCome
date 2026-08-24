import { unzipSync } from 'fflate';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { authenticatedUser } from '../server/_auth.js';
import { isAdminUser } from '../server/_supabase.js';
import { targetBySlug, updateTarget } from '../server/_demo-store.js';
import { createSignedUpload, downloadObject, signedObjectUrl, uploadObject } from '../server/_storage.js';
import { readJson, json, appOrigin } from '../server/_responses.js';
export const config={api:{bodyParser:false}};

const BUILDER_VERSION='31.0-instant-portal';
const MAX_ZIP_BYTES=50*1024*1024;
const MAX_FILES=700;
const MAX_UNPACKED_BYTES=80*1024*1024;
const clean=v=>String(v||'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'site.zip';
function query(req,name){try{return String(req.query?.[name]??new URL(req.url||'/','http://localhost').searchParams.get(name)??'').trim()}catch{return String(req.query?.[name]||'').trim()}}
function safePath(v){let p=decodeURIComponent(String(v||'')).replace(/\\/g,'/').replace(/^\/+/, '');p=p.split('/').filter(Boolean).join('/');if(!p||p==='.')return 'index.html';if(p.includes('..')||p.includes('\0'))throw new Error('Percorso non valido.');return p}
function mime(file=''){const ext=(String(file).toLowerCase().match(/\.([a-z0-9]+)$/)||[])[1]||'';return({html:'text/html; charset=utf-8',htm:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',json:'application/json; charset=utf-8',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif',ico:'image/x-icon',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',pdf:'application/pdf',txt:'text/plain; charset=utf-8',xml:'application/xml; charset=utf-8',webmanifest:'application/manifest+json'})[ext]||'application/octet-stream'}
function isText(file=''){return /\.(?:html?|css|js|mjs|json|svg|txt|xml|webmanifest)$/i.test(file)}
function zipEntries(raw){let unpacked;try{unpacked=unzipSync(new Uint8Array(raw))}catch{throw new Error('ZIP non leggibile. Scaricalo di nuovo da Google AI Studio.')}const entries=[];let total=0;for(const [name,data] of Object.entries(unpacked)){const normalized=String(name||'').replace(/\\/g,'/').replace(/^\/+/, '');if(!normalized||normalized.endsWith('/')||normalized.startsWith('__MACOSX/')||normalized.includes('/.git/')||normalized.includes('/node_modules/'))continue;if(normalized.split('/').some(x=>x==='..'))throw new Error('ZIP non sicuro: contiene percorsi non validi.');total+=data.length;if(total>MAX_UNPACKED_BYTES)throw new Error('Pacchetto troppo grande dopo l’estrazione.');entries.push({name:normalized,data});if(entries.length>MAX_FILES)throw new Error(`Pacchetto troppo complesso: massimo ${MAX_FILES} file importabili.`)}if(!entries.length)throw new Error('ZIP vuoto.');return entries}
function parentOf(file){const i=String(file).lastIndexOf('/');return i<0?'':file.slice(0,i)}
function textOf(entry){return Buffer.from(entry?.data||[]).toString('utf8')}
function projectInfo(entries){
  const pkgs=entries.filter(x=>/(^|\/)package\.json$/i.test(x.name)).sort((a,b)=>a.name.length-b.name.length);
  for(const pkg of pkgs){
    const root=parentOf(pkg.name),prefix=root?root+'/':'',names=entries.map(x=>x.name);
    const index=entries.find(x=>x.name===`${prefix}index.html`||x.name===`${prefix}index.htm`);if(!index)continue;
    let manifest={};try{manifest=JSON.parse(textOf(pkg))}catch{}
    const html=textOf(index);
    const script=(html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/i)||html.match(/<script[^>]+src=["']([^"']+)["'][^>]+type=["']module["']/i)||[])[1]||'';
    const normalizedScript=script.replace(/^\.\//,'').replace(/^\//,'').split(/[?#]/)[0];
    const hasSource=names.some(n=>n.startsWith(`${prefix}src/`))||names.some(n=>new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}[^/]+\\.(?:tsx?|jsx?)$`,'i').test(n));
    const entryExists=normalizedScript&&names.includes(`${prefix}${normalizedScript}`);
    const deps={...(manifest.dependencies||{}),...(manifest.devDependencies||{})};
    const looksVite=Boolean(deps.vite||manifest.scripts?.build?.includes('vite')||/\.(?:tsx?|jsx?)$/i.test(normalizedScript));
    if((hasSource||entryExists)&&looksVite)return{root,prefix,pkg,index,manifest,entry:normalizedScript||'',kind:'vite-source'};
  }
  return null
}
function builtSite(entries){const indexes=entries.filter(x=>/(^|\/)(?:dist|build|out)\/index\.html?$/i.test(x.name));if(!indexes.length)return null;const score=n=>/\/dist\/index\.html$/i.test('/'+n)?100:/\/build\/index\.html$/i.test('/'+n)?95:90;indexes.sort((a,b)=>score(b.name)-score(a.name));const chosen=indexes[0],root=parentOf(chosen.name),prefix=root?root+'/':'';const files=entries.filter(x=>x.name.startsWith(prefix)).map(x=>({name:x.name.slice(prefix.length),data:x.data})).filter(x=>x.name&&!x.name.startsWith('.'));return{root,files,buildMode:'prebuilt'}}
function staticSite(entries){const p=projectInfo(entries);if(p)return null;const indexes=entries.filter(x=>/(^|\/)index\.html?$/i.test(x.name)).sort((a,b)=>a.name.length-b.name.length);if(!indexes.length)return null;const chosen=indexes[0],root=parentOf(chosen.name),prefix=root?root+'/':'';const files=entries.filter(x=>!root||x.name.startsWith(prefix)).map(x=>({name:root?x.name.slice(prefix.length):x.name,data:x.data})).filter(x=>x.name&&!x.name.startsWith('.'));return{root:root||'.',files,buildMode:'static'}}
function packageName(spec=''){const s=String(spec||'').trim();if(!s||s.startsWith('.')||s.startsWith('/')||s.startsWith('http:')||s.startsWith('https:')||s.startsWith('node:')||s.startsWith('@/')||s.startsWith('~/'))return'';if(s.startsWith('@')){const parts=s.split('/');return parts.length>=2?parts.slice(0,2).join('/'):''}return s.split('/')[0]}
function jsImportSpecs(entries,info){const out=new Set();for(const e of entries){if(info.prefix&&!e.name.startsWith(info.prefix))continue;if(!/\.(?:[cm]?[jt]sx?)$/i.test(e.name))continue;const t=textOf(e);const patterns=[/\b(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]/g,/\bimport\(\s*['\"]([^'\"]+)['\"]\s*\)/g,/\brequire\(\s*['\"]([^'\"]+)['\"]\s*\)/g];for(const re of patterns){let m;while((m=re.exec(t))){if(packageName(m[1]))out.add(m[1])}}}out.add('react');out.add('react/jsx-runtime');out.add('react-dom');out.add('react-dom/client');return[...out]}
function cleanVersion(v=''){const s=String(v||'').trim();const m=s.match(/(\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?)/);return m?m[1]:''}
function cdnUrl(spec,info){const pkg=packageName(spec);if(!pkg)return'';const deps={...(info.manifest?.dependencies||{}),...(info.manifest?.devDependencies||{})};const ver=cleanVersion(deps[pkg]);const suffix=spec.slice(pkg.length);let url=`https://esm.sh/${pkg}${ver?`@${ver}`:''}${suffix}`;if(pkg!=='react'&&pkg!=='react-dom')url+=`${url.includes('?')?'&':'?'}external=react,react-dom`;return url}
function importMapFor(specs,info){const imports={};for(const spec of specs){const url=cdnUrl(spec,info);if(url)imports[spec]=url}return imports}
function usesTailwind(entries,info){return entries.some(e=>(!info.prefix||e.name.startsWith(info.prefix))&&/\.(?:css|scss|html?)$/i.test(e.name)&&/(?:@import\s+["']tailwindcss|@tailwind\s|tailwindcss\/browser|cdn\.tailwindcss\.com)/i.test(textOf(e)))}
function tailwindSources(entries,info){return entries.filter(e=>(!info.prefix||e.name.startsWith(info.prefix))&&/\.(?:css|scss)$/i.test(e.name)&&/(?:@import\s+["']tailwindcss|@tailwind\s|@theme\s|@utility\s|@layer\s)/i.test(textOf(e))).map(e=>textOf(e)).join('\n\n').replace(/<\/style/gi,'<\\/style')}
function sanitizeCss(t=''){return String(t).replace(/@import\s+(?:url\()?\s*["']tailwindcss[^"']*["']\s*\)?\s*;?/gi,'').replace(/@tailwind\s+(?:base|components|utilities)\s*;/gi,'')}
async function writeProject(entries,info,dir){for(const entry of entries){if(info.prefix&&!entry.name.startsWith(info.prefix))continue;const rel=info.prefix?entry.name.slice(info.prefix.length):entry.name;if(!rel||rel.startsWith('.')||rel.includes('/node_modules/'))continue;const dest=path.resolve(dir,rel);if(!(dest===dir||dest.startsWith(dir+path.sep)))throw new Error('Percorso sorgente non valido.');await fs.mkdir(path.dirname(dest),{recursive:true});const data=/\.(?:css|scss)$/i.test(rel)?Buffer.from(sanitizeCss(textOf(entry))):Buffer.from(entry.data);await fs.writeFile(dest,data)}}
async function readTree(dir,base=dir){const out=[];for(const item of await fs.readdir(dir,{withFileTypes:true})){const full=path.join(dir,item.name);if(item.isDirectory())out.push(...await readTree(full,base));else out.push({name:path.relative(base,full).split(path.sep).join('/'),data:await fs.readFile(full)})}return out}
function injectRuntime(html,imports,tailwind,tailwindCss){const parts=[];if(Object.keys(imports).length)parts.push(`<script type="importmap">${JSON.stringify({imports}).replace(/<\//g,'<\\/')}</script>`);if(tailwind){parts.push('<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>');if(tailwindCss)parts.push(`<style type="text/tailwindcss">${tailwindCss}</style>`)}const block=parts.join('');if(!block)return html;if(/<head(?:\s[^>]*)?>/i.test(html))return html.replace(/<head(?:\s[^>]*)?>/i,m=>m+block);const moduleAt=html.search(/<script[^>]+type=["']module["']/i);return moduleAt>=0?html.slice(0,moduleAt)+block+html.slice(moduleAt):block+html}
function normalizeHosted(files,portalBase){return files.map(f=>{if(!isText(f.name))return f;let s=Buffer.from(f.data).toString('utf8');s=s.replace(/(["'(`=])\/assets\//g,`$1${portalBase}assets/`).replace(/(["'])\/(favicon\.(?:ico|svg|png)|site\.webmanifest|manifest\.webmanifest)/g,`$1${portalBase}$2`);return{name:f.name,data:Buffer.from(s)}})}
function friendlyBuildError(e){const msg=String(e?.message||e||'Build non riuscita');const missing=msg.match(/(?:failed to resolve import|could not resolve|cannot find package|cannot find module)\s*["']?([^"'\s]+)["']?/i);if(missing)return `Il sorgente contiene un import che il builder non riesce ancora a trattare (${missing[1]}). Dettaglio: ${msg.slice(0,700)}`;return `Easy Come non è riuscito a trasformare questo ZIP in un portale: ${msg.slice(0,1000)}`}
async function buildSource(entries,portalBase){
  const info=projectInfo(entries);if(!info)throw new Error('Non trovo una build pubblicabile né un progetto React/Vite riconoscibile.');
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'easycome-web-')),project=path.join(temp,'project');await fs.mkdir(project,{recursive:true});
  try{
    await writeProject(entries,info,project);
    const indexPath=path.join(project,'index.html');try{await fs.access(indexPath)}catch{throw new Error('Nel progetto sorgente manca index.html.')}
    const srcDir=path.join(project,'src');let aliasRoot=project;try{if((await fs.stat(srcDir)).isDirectory())aliasRoot=srcDir}catch{}
    const specs=jsImportSpecs(entries,info),imports=importMapFor(specs,info),externalPkgs=new Set(specs.map(packageName).filter(Boolean)),tailwind=usesTailwind(entries,info),twCss=tailwindSources(entries,info);
    const [{build:viteBuild},{default:react}]=await Promise.all([import('vite'),import('@vitejs/plugin-react')]);
    const outDir=path.join(project,'easycome-dist');
    await viteBuild({root:project,configFile:false,base:portalBase,plugins:[react()],resolve:{alias:[{find:/^@\//,replacement:aliasRoot+'/'}]},define:{'process.env.NODE_ENV':'"production"','process.env.API_KEY':'""','process.env.GEMINI_API_KEY':'""','import.meta.env.GEMINI_API_KEY':'""'},build:{outDir,emptyOutDir:true,sourcemap:false,target:'es2020',chunkSizeWarningLimit:1800,rollupOptions:{external:id=>externalPkgs.has(packageName(id))}},logLevel:'silent'});
    let files=await readTree(outDir);if(!files.some(x=>/^index\.html?$/i.test(x.name)))throw new Error('La compilazione è terminata senza generare index.html.');
    files=files.map(f=>/^index\.html?$/i.test(f.name)?{...f,data:Buffer.from(injectRuntime(Buffer.from(f.data).toString('utf8'),imports,tailwind,twCss))}:f);
    return{root:'generated-build',files:normalizeHosted(files,portalBase),buildMode:'easycome-v31-instant',diagnostics:{builder:BUILDER_VERSION,projectRoot:info.root||'.',entry:info.entry||'auto',externalPackages:[...new Set(specs.map(packageName).filter(Boolean))],tailwindRuntime:tailwind,outputFiles:files.length}}
  }catch(e){throw new Error(friendlyBuildError(e))}finally{await fs.rm(temp,{recursive:true,force:true}).catch(()=>{})}
}
async function resolveSite(entries,portalBase){const pre=builtSite(entries);if(pre)return{...pre,files:normalizeHosted(pre.files,portalBase),diagnostics:{builder:BUILDER_VERSION,source:'prebuilt'}};if(projectInfo(entries))return buildSource(entries,portalBase);const stat=staticSite(entries);if(stat)return{...stat,files:normalizeHosted(stat.files,portalBase),diagnostics:{builder:BUILDER_VERSION,source:'static'}};throw new Error('Non trovo index.html. Carica lo ZIP completo scaricato da Google AI Studio.')}
async function validateProposal(slug,token){const target=await targetBySlug(slug);if(!target)throw new Error('Prospect non trovato.');const current=target.demo_config&&typeof target.demo_config==='object'?target.demo_config:{};const proposal=current.webProposal||{};if(!proposal.token||proposal.token!==token)throw new Error('Proposta non valida.');if(proposal.expiresAt&&new Date(proposal.expiresAt).getTime()<Date.now()&&proposal.status!=='paid')throw new Error('Proposta scaduta.');return{target,current,proposal}}
async function uploadMany(base,files){let cursor=0;const workers=Array.from({length:Math.min(6,files.length)},async()=>{while(cursor<files.length){const i=cursor++;const f=files[i];await uploadObject(`${base}/${f.name}`,Buffer.from(f.data),mime(f.name))}});await Promise.all(workers)}
export default async function handler(req,res){
  try{
    res.setHeader('x-easycome-builder',BUILDER_VERSION);
    const mode=query(req,'mode')||'prepare',slug=query(req,'d'),token=query(req,'t');if(!slug||!token)throw new Error('Proposta non valida.');
    if(req.method==='GET'){
      const {proposal}=await validateProposal(slug,token);
      if(mode==='download'){if(proposal.status!=='paid')return json(res,403,{error:'Il pacchetto diventa scaricabile dopo l’acquisto.'});if(!proposal.packagePath)return json(res,404,{error:'Pacchetto non disponibile.'});const signed=await signedObjectUrl(proposal.packagePath,300),sep=signed.includes('?')?'&':'?';res.statusCode=302;res.setHeader('location',`${signed}${sep}download=${encodeURIComponent(proposal.packageName||'easycome-web.zip')}`);res.setHeader('cache-control','no-store');return res.end()}
      if(mode==='file'){if(!proposal.siteBasePath)return json(res,404,{error:'Portale sito non ancora pronto.'});let rel=safePath(query(req,'p')||'index.html');if(rel.endsWith('/'))rel+='index.html';let objectPath=`${proposal.siteBasePath}/${rel}`,found;try{found=await downloadObject(objectPath)}catch(e){if(!/\.[a-z0-9]{1,8}$/i.test(rel)){rel='index.html';objectPath=`${proposal.siteBasePath}/${rel}`;found=await downloadObject(objectPath)}else throw e}const type=mime(rel);if(!isText(rel)||found.bytes.length>3_500_000){const signed=await signedObjectUrl(objectPath,600);res.statusCode=302;res.setHeader('location',signed);res.setHeader('cache-control','private, max-age=300');return res.end()}res.statusCode=200;res.setHeader('content-type',type);res.setHeader('cache-control',/\.html?$/i.test(rel)?'private, no-store':'private, max-age=300');res.setHeader('x-frame-options','SAMEORIGIN');res.setHeader('access-control-allow-origin','*');if(/\.html?$/i.test(rel)){res.setHeader('content-security-policy',"sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' https://esm.sh https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data: blob:; connect-src https:; frame-src https:");res.setHeader('referrer-policy','no-referrer')}return res.end(found.bytes)}
      return json(res,400,{error:'Modalità non valida.'});
    }
    if(req.method!=='POST')return json(res,405,{error:'Metodo non consentito.'});
    const user=await authenticatedUser(req);if(!(await isAdminUser(user.id)))return json(res,403,{error:'Solo admin Easy Come.'});
    const {target,current,proposal}=await validateProposal(slug,token),body=await readJson(req,350_000);
    if(mode==='prepare'){
      const filename=clean(body.filename||'site.zip'),size=Number(body.size||0);if(!/\.zip$/i.test(filename))throw new Error('Carica un file ZIP.');if(size<100)throw new Error('Pacchetto vuoto.');if(size>MAX_ZIP_BYTES)throw new Error('Pacchetto troppo grande: massimo 50 MB.');
      const objectPath=`projects/${slug}/${token}/source/${Date.now()}-${filename}`,signed=await createSignedUpload(objectPath),next={...proposal,uploadPending:true,packageName:filename,packageBytes:size,packagePath:objectPath,buildState:'uploaded',builderVersion:BUILDER_VERSION,updatedAt:new Date().toISOString()};await updateTarget(target.id,{demo_config:{...current,webProposal:next}});return json(res,200,{ok:true,upload:signed,proposal:next,builder:BUILDER_VERSION});
    }
    if(mode==='finalize'){
      const objectPath=String(body.path||proposal.packagePath||'').trim();if(!objectPath.startsWith(`projects/${slug}/${token}/source/`))throw new Error('Pacchetto Easy Come non valido.');
      const source=await downloadObject(objectPath);if(source.bytes.length>MAX_ZIP_BYTES)throw new Error('Pacchetto troppo grande.');
      const entries=zipEntries(source.bytes),portalBase=`/web-sites/${encodeURIComponent(slug)}/${encodeURIComponent(token)}/`,site=await resolveSite(entries,portalBase),siteBasePath=`projects/${slug}/${token}/site-v${Date.now()}`;
      await uploadMany(siteBasePath,site.files);
      const origin=appOrigin(req),hostedPreviewUrl=`${origin}${portalBase}`,next={...proposal,packagePath:objectPath,packageName:proposal.packageName||clean(objectPath.split('/').pop()),packageBytes:source.bytes.length,packageUploadedAt:new Date().toISOString(),uploadPending:false,status:proposal.status==='paid'?'paid':'ready',buildState:'ready',builderVersion:BUILDER_VERSION,previewMode:'easycome-hosted',previewUrl:hostedPreviewUrl,hostedPreviewUrl,siteBasePath,siteRoot:site.root,siteFileCount:site.files.length,siteBuildMode:site.buildMode,sitePublishedAt:new Date().toISOString(),buildDiagnostics:site.diagnostics||null,updatedAt:new Date().toISOString()};
      await updateTarget(target.id,{demo_config:{...current,webProposal:next}});return json(res,200,{ok:true,proposal:next,hostedPreviewUrl,buildMode:site.buildMode,diagnostics:site.diagnostics||null,builder:BUILDER_VERSION});
    }
    return json(res,400,{error:'Modalità non valida.'});
  }catch(e){console.error('web-package-upload',BUILDER_VERSION,e);const msg=e?.message||'Importazione non riuscita.';return json(res,/compil|trasform|import|ZIP|sorgente|progetto/i.test(msg)?422:400,{error:msg,builder:BUILDER_VERSION})}
}
