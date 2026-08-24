import { unzipSync } from 'fflate';
import path from 'node:path';
import { transform } from 'sucrase';
import { authenticatedUser } from '../server/_auth.js';
import { isAdminUser } from '../server/_supabase.js';
import { targetBySlug, updateTarget } from '../server/_demo-store.js';
import { createSignedUpload, downloadObject, signedObjectUrl, uploadObject } from '../server/_storage.js';
import { readJson, json, appOrigin } from '../server/_responses.js';
export const config={api:{bodyParser:false}};

const BUILDER_VERSION='37.0-legacy-importer';
const MAX_ZIP_BYTES=50*1024*1024;
const MAX_FILES=700;
const MAX_UNPACKED_BYTES=80*1024*1024;
const CODE_EXTS=['.tsx','.ts','.jsx','.js','.mjs','.cjs'];
const ASSET_RE=/\.(?:png|jpe?g|webp|gif|avif|svg|ico|woff2?|ttf|otf|mp4|webm|mp3|wav|pdf)$/i;
const CSS_RE=/\.(?:css|scss)$/i;
const clean=v=>String(v||'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'site.zip';
function query(req,name){try{return String(req.query?.[name]??new URL(req.url||'/','http://localhost').searchParams.get(name)??'').trim()}catch{return String(req.query?.[name]||'').trim()}}
function safePath(v){let p=decodeURIComponent(String(v||'')).replace(/\\/g,'/').replace(/^\/+/, '');p=p.split('/').filter(Boolean).join('/');if(!p||p==='.')return 'index.html';if(p.includes('..')||p.includes('\0'))throw new Error('Percorso non valido.');return p}
function mime(file=''){const ext=(String(file).toLowerCase().match(/\.([a-z0-9]+)$/)||[])[1]||'';return({html:'text/html; charset=utf-8',htm:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',json:'application/json; charset=utf-8',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif',ico:'image/x-icon',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',pdf:'application/pdf',txt:'text/plain; charset=utf-8',xml:'application/xml; charset=utf-8',webmanifest:'application/manifest+json',mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',wav:'audio/wav'})[ext]||'application/octet-stream'}
function isText(file=''){return /\.(?:html?|css|js|mjs|json|svg|txt|xml|webmanifest)$/i.test(file)}
function zipEntries(raw){let unpacked;try{unpacked=unzipSync(new Uint8Array(raw))}catch{throw new Error('ZIP non leggibile. Scaricalo di nuovo dalla fonte originale.')}const entries=[];let total=0;for(const [name,data] of Object.entries(unpacked)){const normalized=String(name||'').replace(/\\/g,'/').replace(/^\/+/, '');if(!normalized||normalized.endsWith('/')||normalized.startsWith('__MACOSX/')||normalized.includes('/.git/')||normalized.includes('/node_modules/'))continue;if(normalized.split('/').some(x=>x==='..'))throw new Error('ZIP non sicuro: contiene percorsi non validi.');total+=data.length;if(total>MAX_UNPACKED_BYTES)throw new Error('Pacchetto troppo grande dopo l’estrazione.');entries.push({name:normalized,data});if(entries.length>MAX_FILES)throw new Error(`Pacchetto troppo complesso: massimo ${MAX_FILES} file importabili.`)}if(!entries.length)throw new Error('ZIP vuoto.');return entries}
function businessUxGate(entries,approvedManifest=[]){
  const problems=[];
  for(const e of entries){
    if(!/\.(?:html?|tsx?|jsx?|mjs|cjs)$/i.test(e.name))continue;
    const t=textOf(e);
    if(/\bcopia\s+(?:il\s+)?(?:messaggio|ordine|prenotazione|richiesta)\b/i.test(t)||/\bcopy\s+(?:message|order|booking|request)\b/i.test(t))problems.push(`${e.name}: flusso “copia messaggio/ordine”`);
    if(/navigator\.clipboard\.writeText/i.test(t)&&/(?:carrello|cart|ordine|order|prenot|booking|messaggio|message)/i.test(t))problems.push(`${e.name}: clipboard usata come completamento di un flusso commerciale`);
    if(/(?:fatto|creato|generato|costruito)\s+(?:con|da)\s+(?:l[’']?\s*)?(?:AI|intelligenza artificiale)/i.test(t)||/non\s+per\s+sembrare[^\n]{0,80}(?:AI|intelligenza artificiale)/i.test(t))problems.push(`${e.name}: copy cliente che cita il processo di produzione`);
    if(/prenotazione\s+(?:è\s+)?confermata|booking\s+confirmed/i.test(t)&&!/(?:fetch\s*\(|axios|wa\.me|api\.whatsapp|mailto:)/i.test(t))problems.push(`${e.name}: conferma prenotazione senza destinazione/backend reale`);
  }
  const approved=new Set((Array.isArray(approvedManifest)?approvedManifest:[]).map(x=>String(x?.url||x||'').trim()).filter(Boolean));
  const suspiciousHosts=/(?:images\.unsplash\.com|source\.unsplash\.com|images\.pexels\.com|pixabay\.com|cdn\.pixabay\.com)/i;
  const remoteImage=/https?:\/\/[^\s\"'`)]+(?:\.(?:png|jpe?g|webp|gif|avif)(?:\?[^\s\"'`)]*)?|(?:googleusercontent|ggpht|googleusercontent\.com)[^\s\"'`)]*)/gi;
  for(const e of entries){
    if(!/\.(?:html?|css|tsx?|jsx?|mjs|cjs|json)$/i.test(e.name))continue;const t=textOf(e);let m;while((m=remoteImage.exec(t))){const url=m[0].replace(/[),.;]+$/,'');if(approved.has(url))continue;if(suspiciousHosts.test(url)||!approved.size)problems.push(`${e.name}: immagine esterna non approvata (${url.slice(0,120)})`);}
  }
  const visualText=entries.filter(e=>/\.(?:html?|css|tsx?|jsx?|mjs|cjs)$/i.test(e.name)).map(textOf).join('\n');
  const customType=/(?:fonts\.googleapis\.com|@font-face|Newsreader|Fraunces|Bodoni\s+Moda|Cormorant\s+Garamond|DM\s+Serif\s+Display|Source\s+Serif\s+4|Libre\s+Baskerville|Syne|Bricolage\s+Grotesque|Archivo(?:\s+Black)?|Barlow\s+Condensed|Atkinson\s+Hyperlegible|IBM\s+Plex\s+Sans|Libre\s+Franklin|Work\s+Sans|Manrope|Public\s+Sans|Source\s+Sans\s+3|Lora)/i.test(visualText);
  const genericPrimary=/(?:font-family\s*:\s*[^;}{]{0,100}(?:Inter|Poppins|Montserrat|Roboto|Arial|Helvetica|system-ui)|fontFamily\s*[:=][^,}\n]{0,100}(?:Inter|Poppins|Montserrat|Roboto|Arial|Helvetica|system-ui))/i.test(visualText);
  if(genericPrimary&&!customType)problems.push('Tipografia generica rilevata: manca una vera coppia display/body art-directed. Scegli esplicitamente una tipografia display/body coerente con il brand.');
  if(problems.length)throw new Error(`QUALITY GATE EASY COME: il sito contiene una funzione, un testo o un'immagine che non possiamo pubblicare. ${[...new Set(problems)].slice(0,5).join(' · ')}. Correggi il progetto: CTA reali, fotografie esclusivamente approvate e coerenti con il contenuto, e una tipografia realmente art-directed.`);
}
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
    const sourceNames=names.filter(n=>n.startsWith(prefix)).map(n=>n.slice(prefix.length));
    const hasSource=sourceNames.some(n=>/^(?:src\/)?[^/]+\.(?:tsx?|jsx?)$/i.test(n))||sourceNames.some(n=>n.startsWith('src/')&&/\.(?:tsx?|jsx?)$/i.test(n));
    const entryExists=normalizedScript&&sourceNames.includes(normalizedScript);
    const deps={...(manifest.dependencies||{}),...(manifest.devDependencies||{})};
    const looksReact=Boolean(deps.react||deps.vite||manifest.scripts?.build||/\.(?:tsx?|jsx?)$/i.test(normalizedScript)||sourceNames.some(n=>/(?:^|\/)App\.(?:tsx?|jsx?)$/i.test(n)));
    if((hasSource||entryExists)&&looksReact)return{root,prefix,pkg,index,manifest,entry:normalizedScript||'',kind:'react-source'};
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
function sanitizeCss(t=''){return String(t).replace(/@import\s+(?:url\()?\s*["']tailwindcss[^"']*["']\s*\)?\s*;?/gi,'').replace(/@tailwind\s+(?:base|components|utilities)\s*;/gi,'')}
function normalizeHosted(files,portalBase){return files.map(f=>{if(!isText(f.name))return f;let s=Buffer.from(f.data).toString('utf8');s=s.replace(/(["'(`=])\/assets\//g,`$1${portalBase}assets/`).replace(/(["'])\/(favicon\.(?:ico|svg|png)|site\.webmanifest|manifest\.webmanifest)/g,`$1${portalBase}$2`);return{name:f.name,data:Buffer.from(s)}})}
function encodePortalPath(p=''){return String(p).split('/').filter(Boolean).map(encodeURIComponent).join('/')}
function stripQuery(spec=''){return String(spec).split(/[?#]/)[0]}
function extOf(p=''){return path.posix.extname(stripQuery(p)).toLowerCase()}
function isCodePath(p=''){return CODE_EXTS.includes(extOf(p))}
function sourceRelative(entry,info){return info.prefix?entry.name.slice(info.prefix.length):entry.name}
function sourceMap(entries,info){const map=new Map();for(const e of entries){if(info.prefix&&!e.name.startsWith(info.prefix))continue;const rel=sourceRelative(e,info);if(rel&&!rel.startsWith('.')&&!rel.includes('/node_modules/'))map.set(rel,e)}return map}
function sourceCandidates(base){const clean=stripQuery(base).replace(/^\.\//,'');const out=[clean];if(!path.posix.extname(clean)){for(const ext of CODE_EXTS)out.push(clean+ext);out.push(clean+'.json',clean+'.css');for(const ext of CODE_EXTS)out.push(path.posix.join(clean,'index'+ext));out.push(path.posix.join(clean,'index.json'),path.posix.join(clean,'index.css'))}return [...new Set(out)]}
function resolveLocal(spec,importerRel,map,aliasRoot){let raw=stripQuery(spec);if(raw.startsWith('@/'))raw=path.posix.join(aliasRoot,raw.slice(2));else if(raw.startsWith('~/'))raw=path.posix.join(aliasRoot,raw.slice(2));else if(raw.startsWith('/'))raw=raw.slice(1);else raw=path.posix.normalize(path.posix.join(path.posix.dirname(importerRel),raw));raw=raw.replace(/^\.\//,'');for(const c of sourceCandidates(raw)){if(map.has(c))return c}return''}
function outputModuleRel(rel){return `modules/${String(rel).replace(/\.(?:tsx?|jsx?|mjs|cjs)$/i,'.js')}`}
function relModuleSpecifier(fromOut,toOut){let r=path.posix.relative(path.posix.dirname(fromOut),toOut);if(!r.startsWith('.'))r='./'+r;return r}
function cssUrlRewrite(css,cssRel,portalBase,map){return String(css).replace(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi,(m,q,spec)=>{const s=String(spec).trim();if(!s||/^(?:data:|https?:|blob:|#)/i.test(s))return m;const target=resolveLocal(s,cssRel,map,'src');if(!target)return m;return `url("${portalBase}source/${encodePortalPath(target)}")`})}
function transformAssetImports(code,importerRel,map,aliasRoot,portalBase){
  let out=String(code);
  out=out.replace(/import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]\s*;?/g,(m,name,spec)=>{const target=resolveLocal(spec,importerRel,map,aliasRoot);if(target&&ASSET_RE.test(target))return `const ${name} = ${JSON.stringify(portalBase+'source/'+encodePortalPath(target))};`;return m});
  out=out.replace(/import\s+['"]([^'"]+\.(?:css|scss))['"]\s*;?/gi,'');
  return out;
}
function rewriteModuleSpecifiers(code,importerRel,map,aliasRoot){
  const importerOut=outputModuleRel(importerRel);
  const rewrite=spec=>{if(packageName(spec)||/^(?:https?:|data:|blob:)/i.test(spec))return spec;const target=resolveLocal(spec,importerRel,map,aliasRoot);if(!target)return spec;if(CSS_RE.test(target)||ASSET_RE.test(target))return spec;if(!isCodePath(target))return spec;return relModuleSpecifier(importerOut,outputModuleRel(target))};
  let out=String(code);
  out=out.replace(/(\b(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"])([^'\"]+)(['\"])/g,(m,a,s,b)=>a+rewrite(s)+b);
  out=out.replace(/(\bimport\(\s*['\"])([^'\"]+)(['\"]\s*\))/g,(m,a,s,b)=>a+rewrite(s)+b);
  return out;
}
function replaceEnv(code){return String(code).replace(/process\.env\.NODE_ENV/g,'"production"').replace(/process\.env\.(?:API_KEY|GEMINI_API_KEY)/g,'""').replace(/import\.meta\.env\.(?:GEMINI_API_KEY|VITE_GEMINI_API_KEY|API_KEY)/g,'""')}
function compileModule(entryRel,entry,map,aliasRoot,portalBase){
  let code=textOf(entry);
  code=transformAssetImports(code,entryRel,map,aliasRoot,portalBase);
  code=rewriteModuleSpecifiers(code,entryRel,map,aliasRoot);
  code=replaceEnv(code);
  const ext=extOf(entryRel),transforms=[];
  if(ext==='.ts'||ext==='.tsx')transforms.push('typescript');
  if(ext==='.jsx'||ext==='.tsx'){
    if(!/\b(?:import\s+\*?\s*React|import\s+React\b|const\s+React\b)/.test(code))code=`import React from 'react';\n${code}`;
    transforms.push('jsx');
  }
  try{return transform(code,{transforms,production:true,disableESTransforms:true}).code}catch(e){throw new Error(`Errore nel file ${entryRel}: ${e.message||e}`)}
}
function entryFromInfo(info,map){
  if(info.entry&&map.has(info.entry))return info.entry;
  const preferred=['src/main.tsx','src/main.ts','src/main.jsx','src/main.js','src/index.tsx','src/index.ts','src/index.jsx','src/index.js','index.tsx','index.ts','index.jsx','index.js','App.tsx','App.ts','App.jsx','App.js'];
  return preferred.find(x=>map.has(x))||[...map.keys()].find(isCodePath)||''
}
function injectBrowserRuntime(html,{imports,tailwind,tailwindCss,entryUrl,cssUrl,portalBase}){
  let out=String(html);
  out=out.replace(/<script[^>]+type=["']module["'][^>]+src=["'][^"']+["'][^>]*>\s*<\/script>/gi,'').replace(/<script[^>]+src=["'][^"']+["'][^>]+type=["']module["'][^>]*>\s*<\/script>/gi,'');
  const parts=[`<base href="${portalBase}">`];
  if(Object.keys(imports).length)parts.push(`<script type="importmap">${JSON.stringify({imports}).replace(/<\//g,'<\\/')}</script>`);
  if(cssUrl)parts.push(`<link rel="stylesheet" href="${cssUrl}">`);
  if(tailwind){parts.push('<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>');if(tailwindCss)parts.push(`<style type="text/tailwindcss">${String(tailwindCss).replace(/<\/style/gi,'<\\/style')}</style>`)}
  parts.push(`<script type="module" src="${entryUrl}"></script>`);
  const block=parts.join('');
  if(/<head(?:\s[^>]*)?>/i.test(out))return out.replace(/<head(?:\s[^>]*)?>/i,m=>m+block);
  return block+out
}
function friendlyBuildError(e){const msg=String(e?.message||e||'Build non riuscita');const missing=msg.match(/(?:failed to resolve import|could not resolve|cannot find package|cannot find module|non trovo il modulo)\s*["']?([^"'\s]+)["']?/i);if(missing)return `Il sorgente contiene un import che il Browser Compiler non riesce ancora a risolvere (${missing[1]}). Dettaglio: ${msg.slice(0,700)}`;return `Easy Come Browser Compiler non è riuscito a trasformare questo ZIP: ${msg.slice(0,1000)}`}
export async function buildSource(entries,portalBase){
  const info=projectInfo(entries);if(!info)throw new Error('Non trovo una build pubblicabile né un progetto React riconoscibile.');
  try{
    const map=sourceMap(entries,info),aliasRoot=map.has('src/App.tsx')||[...map.keys()].some(x=>x.startsWith('src/'))?'src':'';
    const entry=entryFromInfo(info,map);if(!entry)throw new Error('Non trovo il file di ingresso React/TypeScript.');
    const specs=jsImportSpecs(entries,info),imports=importMapFor(specs,info),tailwind=usesTailwind(entries,info);
    const files=[];let cssChunks=[],compiled=0;
    for(const [rel,e] of map){
      if(isCodePath(rel)){files.push({name:outputModuleRel(rel),data:Buffer.from(compileModule(rel,e,map,aliasRoot,portalBase))});compiled++;continue}
      if(CSS_RE.test(rel)){const raw=sanitizeCss(textOf(e));if(!/(?:@import\s+["']tailwindcss|@tailwind\s|@theme\s|@utility\s)/i.test(textOf(e)))cssChunks.push(cssUrlRewrite(raw,rel,portalBase,map));continue}
      if(rel==='package.json'||rel==='index.html'||rel==='index.htm'||/^vite\.config\./i.test(rel)||/^tsconfig/i.test(rel))continue;
      if(rel.startsWith('public/'))files.push({name:rel.slice(7),data:e.data});else if(ASSET_RE.test(rel)||/\.(?:json|txt|xml|webmanifest)$/i.test(rel))files.push({name:`source/${rel}`,data:e.data})
    }
    if(!compiled)throw new Error('Il progetto non contiene moduli React/JavaScript compilabili.');
    const css=cssChunks.join('\n\n'),cssName=css?'easycome-site.css':'',entryUrl=portalBase+encodePortalPath(outputModuleRel(entry));
    if(css)files.push({name:cssName,data:Buffer.from(css)});
    const twCss=[...map.entries()].filter(([rel])=>CSS_RE.test(rel)).map(([,e])=>textOf(e)).filter(t=>/(?:@import\s+["']tailwindcss|@tailwind\s|@theme\s|@utility\s)/i.test(t)).join('\n\n');
    const html=injectBrowserRuntime(textOf(info.index),{imports,tailwind,tailwindCss:twCss,entryUrl,cssUrl:cssName?portalBase+cssName:'',portalBase});
    files.unshift({name:'index.html',data:Buffer.from(html)});
    return{root:'browser-compiled',files:normalizeHosted(files,portalBase),buildMode:'easycome-v32-browser',diagnostics:{builder:BUILDER_VERSION,projectRoot:info.root||'.',entry,compiledModules:compiled,externalPackages:[...new Set(specs.map(packageName).filter(Boolean))],tailwindRuntime:tailwind,outputFiles:files.length,runtimeInstall:false,rollup:false}}
  }catch(e){throw new Error(friendlyBuildError(e))}
}
async function resolveSite(entries,portalBase){const pre=builtSite(entries);if(pre)return{...pre,files:normalizeHosted(pre.files,portalBase),diagnostics:{builder:BUILDER_VERSION,source:'prebuilt'}};if(projectInfo(entries))return buildSource(entries,portalBase);const stat=staticSite(entries);if(stat)return{...stat,files:normalizeHosted(stat.files,portalBase),diagnostics:{builder:BUILDER_VERSION,source:'static'}};throw new Error('Non trovo index.html. Carica un pacchetto web completo.')}
async function validateProposal(slug,token){const target=await targetBySlug(slug);if(!target)throw new Error('Prospect non trovato.');const current=target.demo_config&&typeof target.demo_config==='object'?target.demo_config:{};const proposal=current.webProposal||{};if(!proposal.token||proposal.token!==token)throw new Error('Proposta non valida.');if(proposal.expiresAt&&new Date(proposal.expiresAt).getTime()<Date.now()&&proposal.status!=='paid')throw new Error('Proposta scaduta.');return{target,current,proposal}}
async function uploadMany(base,files){let cursor=0;const workers=Array.from({length:Math.min(6,files.length)},async()=>{while(cursor<files.length){const i=cursor++;const f=files[i];await uploadObject(`${base}/${f.name}`,Buffer.from(f.data),mime(f.name))}});await Promise.all(workers)}
export default async function handler(req,res){
  try{
    res.setHeader('x-easycome-builder',BUILDER_VERSION);
    const mode=query(req,'mode')||'prepare',slug=query(req,'d'),token=query(req,'t');if(!slug||!token)throw new Error('Proposta non valida.');
    if(req.method==='GET'){
      const {proposal}=await validateProposal(slug,token);
      if(mode==='download'){if(proposal.status!=='paid')return json(res,403,{error:'Il pacchetto diventa scaricabile dopo l’acquisto.'});if(!proposal.packagePath)return json(res,404,{error:'Pacchetto non disponibile.'});const signed=await signedObjectUrl(proposal.packagePath,300),sep=signed.includes('?')?'&':'?';res.statusCode=302;res.setHeader('location',`${signed}${sep}download=${encodeURIComponent(proposal.packageName||'easycome-web.zip')}`);res.setHeader('cache-control','no-store');return res.end()}
      if(mode==='file'){if(!proposal.siteBasePath)return json(res,404,{error:'Portale sito non ancora pronto.'});let rel=safePath(query(req,'p')||'index.html');if(rel.endsWith('/'))rel+='index.html';let objectPath=`${proposal.siteBasePath}/${rel}`,found;try{found=await downloadObject(objectPath)}catch(e){if(!/\.[a-z0-9]{1,8}$/i.test(rel)){rel='index.html';objectPath=`${proposal.siteBasePath}/${rel}`;found=await downloadObject(objectPath)}else throw e}const type=mime(rel);if(!isText(rel)||found.bytes.length>3_500_000){const signed=await signedObjectUrl(objectPath,600);res.statusCode=302;res.setHeader('location',signed);res.setHeader('cache-control','private, max-age=300');return res.end()}res.statusCode=200;res.setHeader('content-type',type);res.setHeader('cache-control',/\.html?$/i.test(rel)?'private, no-store':'private, max-age=300');res.setHeader('x-frame-options','SAMEORIGIN');res.setHeader('access-control-allow-origin','*');if(/\.html?$/i.test(rel)){res.setHeader('content-security-policy',"sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' https://esm.sh https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; connect-src https:; frame-src https:");res.setHeader('referrer-policy','no-referrer')}return res.end(found.bytes)}
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
      const entries=zipEntries(source.bytes);businessUxGate(entries,current.websiteHandoff?.config?.imageManifest||current.websiteCreative?.config?.imageManifest||current.websiteAiBrief?.imageManifest||[]);const portalBase=`/web-sites/${encodeURIComponent(slug)}/${encodeURIComponent(token)}/`,site=await resolveSite(entries,portalBase),siteBasePath=`projects/${slug}/${token}/site-v${Date.now()}`;
      await uploadMany(siteBasePath,site.files);
      const origin=appOrigin(req),hostedPreviewUrl=`${origin}${portalBase}`,next={...proposal,packagePath:objectPath,packageName:proposal.packageName||clean(objectPath.split('/').pop()),packageBytes:source.bytes.length,packageUploadedAt:new Date().toISOString(),uploadPending:false,status:proposal.status==='paid'?'paid':'ready',buildState:'ready',builderVersion:BUILDER_VERSION,previewMode:'easycome-hosted',previewUrl:hostedPreviewUrl,hostedPreviewUrl,siteBasePath,siteRoot:site.root,siteFileCount:site.files.length,siteBuildMode:site.buildMode,sitePublishedAt:new Date().toISOString(),buildDiagnostics:site.diagnostics||null,updatedAt:new Date().toISOString()};
      await updateTarget(target.id,{demo_config:{...current,webProposal:next}});return json(res,200,{ok:true,proposal:next,hostedPreviewUrl,buildMode:site.buildMode,diagnostics:site.diagnostics||null,builder:BUILDER_VERSION});
    }
    return json(res,400,{error:'Modalità non valida.'});
  }catch(e){console.error('web-package-upload',BUILDER_VERSION,e);const msg=e?.message||'Importazione non riuscita.';return json(res,/compil|trasform|import|ZIP|sorgente|progetto|Browser Compiler/i.test(msg)?422:400,{error:msg,builder:BUILDER_VERSION})}
}
