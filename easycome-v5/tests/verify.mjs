import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
globalThis.window=globalThis;
for(const file of ['js/zip.js','js/product-templates.js','js/generator-core.js']) vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
const G=globalThis.ECGenerator;
const appSource=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const match=appSource.match(/const TEMPLATES = (\[[\s\S]*?\n  \]);/);
assert(match,'Catalogo modelli non leggibile');
const templates=vm.runInNewContext(`(${match[1]})`);
assert(templates.length>=11,'Il catalogo V7 deve coprire almeno 11 casi aziendali');

function projectFrom(template,index){
 const p=G.defaultProject();
 p.company={...p.company,name:`Impresa Test ${index+1}`,slug:`impresa-test-${index+1}`,industry:template.industry||'Impresa',description:(template.description||'Sistema operativo personalizzato per centralizzare dati e processi quotidiani.')+' Flusso completo e verificabile.',email:`titolare${index+1}@example.com`,layout:'studio',style:'studio'};
 p.modules=[...new Set([...(template.modules||['crm','tasks']),'easycome_hub'])];
 p.customEntities=structuredClone(template.custom||[]);
 p.pricing={...p.pricing,mode:template.pricingMode||'none',enabled:['fixed','hourly','subscription','dynamic'].includes(template.pricingMode||'none'),basePrice:template.pricingMode==='none'?0:60,rules:template.pricingMode==='dynamic'?[{type:'duration_discount',name:'Sconto durata',min:7,percent:5}]:[],extras:[]};
 p.delivery.previewApproved=true;
 p.identity={...p.identity,supabaseUrl:'https://example.supabase.co',supabaseAnonKey:'anon-test',ownerUserId:'00000000-0000-4000-8000-000000000001',ownerEmail:p.company.email,easycomeBaseUrl:'https://easy-come.it',dataMode:'local'};
 return p;
}

const results=[];
for(const [index,template] of templates.entries()){
 const project=projectFrom(template,index);
 const audit=G.auditProject(project);
 assert.equal(audit.blockers.length,0,`${template.name}: ${audit.blockers.join(' | ')}`);
 const result=G.generatePackage(project);
 const files=Object.fromEntries(result.files.map(f=>[f.name,f.data]));
 for(const required of ['index.html','easycome-hub.html','manuale.html','js/app.js','js/hub.js','js/config.js','supabase/schema.sql','Excel/LEGGIMI.md','DOCUMENTI/MANUALE-OPERATIVO.pdf','BRAND/brand-guide.html']) assert(required in files,`${template.name}: manca ${required}`);
 assert(!('js/portal.js' in files),`${template.name}: il vecchio portale pubblico non deve essere generato`);
 assert(String(files['js/app.js']).includes('Easy Come Hub')&&String(files['js/app.js']).toLowerCase().includes('stesse credenziali'),`${template.name}: account/Hub non collegati`);
 assert(String(files['js/hub.js']).includes('easycome_support_requests'),`${template.name}: Hub non operativo`);
 assert(String(files['manuale.html']).includes('stesso indirizzo email')||String(files['manuale.html']).includes('stessa password'),`${template.name}: manuale account incompleto`);
 new Function(String(files['js/app.js'])); new Function(String(files['js/hub.js'])); new Function(String(files['sw.js']));
 const xlsx=Object.entries(files).find(([name])=>name.endsWith('.xlsx'))?.[1]; assert(xlsx instanceof Uint8Array&&xlsx[0]===0x50,`${template.name}: Excel non valido`);
 results.push({template:template.name,score:audit.score,files:result.files.length,total:result.price.total});
}

const {calculateServerPrice}=await import(path.join(root,'api/_pricing.js'));
for(const [i,t] of templates.entries()) assert.equal(calculateServerPrice(projectFrom(t,i)).total,G.calculatePrice(projectFrom(t,i)).total,`${t.name}: prezzo server/browser diverso`);

const complete=projectFrom(templates.find(t=>t.id==='complete'),50);
complete.modules=[...new Set([...complete.modules,'website','mobile_app','branding','ai','automations'])];
const browserResult=G.generatePackage(complete);
const {ECGenerator:ServerGenerator}=await import(path.join(root,'api/_generator-node.js'));
const serverResult=ServerGenerator.generatePackage(complete);
assert.equal(serverResult.files.length,browserResult.files.length,'Generatori browser/server disallineati');
const requiredV7=['public-site/index.html','mobile/index.html','AI/README.md','automations/n8n-workflow.json','easycome-hub.html','manuale.html'];
const names=new Set(browserResult.files.map(f=>f.name));for(const n of requiredV7)assert(names.has(n),`Pacchetto completo: manca ${n}`);

for(const file of ['assets/v7.css','js/account.js','api/public-config.js','api/_auth.js','api/create-checkout-session.js','api/generate-delivery.js','checkout/schema.sql']) assert(fs.existsSync(path.join(root,file)),`Manca ${file}`);
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(index.includes('js/account.js')&&index.includes('@supabase/supabase-js')&&index.includes('accountGate'),'Registrazione centrale non montata');
assert(!appSource.toLowerCase().includes('portale pubblico'),'Configuratore contiene ancora Portale pubblico');
assert(appSource.includes('LAYOUT_PRESETS')&&appSource.includes('PRICE_MODES')&&appSource.includes('SECTION_PRESETS'),'Wizard semplificato incompleto');
assert(appSource.includes("previewMode = 'dashboard'")&&!appSource.includes("previewMode = 'sheet'"),'Anteprima non deve partire dal foglio Excel');
assert(appSource.includes('authorization: `Bearer'),'Checkout non invia la sessione account');
const checkout=fs.readFileSync(path.join(root,'api/create-checkout-session.js'),'utf8');
assert(checkout.includes('authenticatedUser')&&checkout.includes('user_id: user.id'),'Checkout non legato all’account');
const delivery=fs.readFileSync(path.join(root,'api/generate-delivery.js'),'utf8');
assert(delivery.includes('ownerUserId')&&delivery.includes('SUPABASE_ANON_KEY')&&delivery.includes('easycome-studio-v7.zip'),'Consegna V7 non inietta identità centrale');
const schema=fs.readFileSync(path.join(root,'checkout/schema.sql'),'utf8');
for(const x of ['easycome_profiles','easycome_projects','easycome_support_requests','user_id uuid','projects_own','support_own_insert'])assert(schema.includes(x),`Schema account incompleto: ${x}`);

const noImpl=projectFrom(templates[0],90);assert.equal(G.calculatePrice(noImpl).implementation,0);noImpl.delivery.implementationSelected=true;assert.equal(G.calculatePrice(noImpl).implementation,150);assert.equal(calculateServerPrice(noImpl).implementation,150);

await import(path.join(root,'scripts/build-public.mjs'));
for(const n of ['index.html','assets/v7.css','js/account.js','js/app.js'])assert(fs.existsSync(path.join(root,'dist-public',n)),`Build pubblica: manca ${n}`);
for(const n of ['builder.html','js/zip.js','js/product-templates.js'])assert(!fs.existsSync(path.join(root,'dist-public',n)),`Build pubblica espone ${n}`);

const blob=globalThis.EasyZip.createZip(browserResult.files);const zipPath=path.join(root,'tests','generated-v7.zip');fs.writeFileSync(zipPath,Buffer.from(await blob.arrayBuffer()));assert(fs.statSync(zipPath).size>100000,'ZIP V7 troppo piccolo');
console.log(JSON.stringify({ok:true,version:'7.0',templates:results,zipPath},null,2));
