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
assert(templates.length>=11,'Il catalogo V8 deve coprire almeno 11 casi aziendali');

function projectFrom(template,index){
 const p=G.defaultProject();
 p.company={...p.company,name:`Impresa Test ${index+1}`,slug:`impresa-test-${index+1}`,industry:template.industry||'Impresa',description:(template.description||'Sistema operativo personalizzato per centralizzare dati e processi quotidiani.')+' Flusso completo e verificabile.',email:`titolare${index+1}@example.com`,layout:'studio',style:'studio'};
 p.modules=[...new Set([...(template.modules||['crm','tasks']),'easycome_hub'])];
 p.customEntities=structuredClone(template.custom||[]);
 p.pricing={...p.pricing,mode:template.pricingMode||'none',enabled:['fixed','hourly','subscription','dynamic'].includes(template.pricingMode||'none'),basePrice:template.pricingMode==='none'?0:60,rules:template.pricingMode==='dynamic'?[{type:'duration_discount',name:'Sconto durata',min:7,percent:5}]:[],extras:[]};
 p.delivery={...p.delivery,previewApproved:true,managedServiceSelected:index%2===0,managedServicePrice:30};
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
 assert(result.filename.endsWith('-easycome-v8.zip'),`${template.name}: nome ZIP non V8`);
 assert(!('js/portal.js' in files),`${template.name}: il vecchio portale pubblico non deve essere generato`);
 assert(String(files['js/app.js']).includes('Easy Come Hub')&&String(files['js/app.js']).toLowerCase().includes('stesse credenziali'),`${template.name}: account/Hub non collegati`);
 const hub=String(files['js/hub.js']);
 for(const text of ['Richiedi un incontro','Gestione tecnica','Nuove funzioni','easycome_support_requests']) assert(hub.includes(text),`${template.name}: Hub V8 incompleto: ${text}`);
 assert(String(files['manuale.html']).includes('stesso indirizzo email')||String(files['manuale.html']).includes('stessa password'),`${template.name}: manuale account incompleto`);
 new Function(String(files['js/app.js'])); new Function(String(files['js/hub.js'])); new Function(String(files['sw.js']));
 const xlsx=Object.entries(files).find(([name])=>name.endsWith('.xlsx'))?.[1]; assert(xlsx instanceof Uint8Array&&xlsx[0]===0x50,`${template.name}: Excel non valido`);
 results.push({template:template.name,score:audit.score,files:result.files.length,total:result.price.total,managed:project.delivery.managedServiceSelected});
}

const {calculateServerPrice,compactProject,normalizeModuleIds}=await import(path.join(root,'api/_pricing.js'));
for(const [i,t] of templates.entries()) assert.equal(calculateServerPrice(projectFrom(t,i)).total,G.calculatePrice(projectFrom(t,i)).total,`${t.name}: prezzo server/browser diverso`);
const legacyPortal=projectFrom(templates[0],75);legacyPortal.delivery.managedServiceSelected=true;legacyPortal.modules.push('portal');
assert(!normalizeModuleIds(legacyPortal.modules).includes('portal'),'Alias legacy portal non migrato');
assert(normalizeModuleIds(legacyPortal.modules).includes('easycome_hub'),'Alias legacy portal non convertito in Easy Come Hub');
assert.doesNotThrow(()=>calculateServerPrice(legacyPortal),'Il checkout deve accettare i progetti V6 con modulo portal');
assert(!compactProject(legacyPortal).modules.includes('portal'),'Il progetto compatto non deve conservare portal');
assert.equal(compactProject(legacyPortal).delivery.managedServiceSelected,true,'La gestione tecnica non sopravvive alla compattazione');

const complete=projectFrom(templates.find(t=>t.id==='complete'),50);
complete.modules=[...new Set([...complete.modules,'website','mobile_app','branding','ai','automations'])];
const browserResult=G.generatePackage(complete);
const {ECGenerator:ServerGenerator}=await import(path.join(root,'api/_generator-node.js'));
const serverResult=ServerGenerator.generatePackage(complete);
assert.equal(serverResult.files.length,browserResult.files.length,'Generatori browser/server disallineati');
for(const n of ['public-site/index.html','mobile/index.html','AI/README.md','automations/n8n-workflow.json','easycome-hub.html','manuale.html'])assert(new Set(browserResult.files.map(f=>f.name)).has(n),`Pacchetto completo: manca ${n}`);

for(const file of ['profilo.html','assets/profile.css','assets/v7.css','js/profile.js','js/account.js','api/create-managed-subscription.js','api/create-billing-portal.js','api/download-order.js','api/public-config.js','api/_auth.js','api/create-checkout-session.js','api/generate-delivery.js','api/stripe-webhook.js','checkout/schema.sql','SUPABASE_V8_UPGRADE.sql']) assert(fs.existsSync(path.join(root,file)),`Manca ${file}`);
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(index.includes('js/account.js')&&index.includes('@supabase/supabase-js')&&index.includes('accountGate'),'Registrazione centrale non montata');
assert(!appSource.toLowerCase().includes('portale pubblico'),'Configuratore contiene ancora Portale pubblico');
for(const marker of ['start-paths','profilo.html?tab=meeting','managedServiceSelected','30 € / mese','LAYOUT_PRESETS','PRICE_MODES','SECTION_PRESETS'])assert(appSource.includes(marker),`Configuratore V8 incompleto: ${marker}`);
assert(appSource.includes("previewMode = 'dashboard'")&&!appSource.includes("previewMode = 'sheet'"),'Anteprima non deve partire dal foglio Excel');
assert(appSource.includes('authorization: `Bearer'),'Checkout non invia la sessione account');
const profile=fs.readFileSync(path.join(root,'js/profile.js'),'utf8');
for(const marker of ['easycome_orders','easycome_projects','easycome_support_requests','easycome_subscriptions','create-managed-subscription','create-billing-portal','download-order']) assert(profile.includes(marker),`Profilo incompleto: ${marker}`);

assert(appSource.includes('easycome-generator-pro-draft:${userId}')||appSource.includes('easycome-generator-pro-draft:${userId}'),'Bozze non isolate per account');
assert(appSource.includes("window.addEventListener('easycome:account-ready'")&&!appSource.includes("{ once: true }"),'Cambio account non gestito');
const generatedApp=fs.readFileSync(path.join(root,'templates/generated-app.js'),'utf8');
assert(generatedApp.includes('refreshEntityContent'),'Ricerca gestionale continua non corretta');
assert(generatedApp.includes('while (cells.length % 7)'),'Calendario senza celle finali di chiusura');
assert(fs.existsSync(path.join(root,'api/support-request.js')),'Manca endpoint inbox supporto');
assert(profile.includes("fetch('/api/support-request'"),'Profilo non inoltra le richieste alla inbox centrale');
const hubTemplate=fs.readFileSync(path.join(root,'templates/generated-hub.js'),'utf8');
assert(hubTemplate.includes('/api/support-request'),'Hub generato non inoltra le richieste alla inbox centrale');
const mainIndex=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(mainIndex.includes('desktopAccountSlot')&&mainIndex.includes('mobileAccountSlot'),'Account non visibile nel builder desktop/mobile');
const checkout=fs.readFileSync(path.join(root,'api/create-checkout-session.js'),'utf8');
for(const marker of ["mode', managedServiceSelected ? 'subscription' : 'payment'",'recurring][interval]','EASYCOME_MANAGED_MONTHLY_CENTS','subscription_data[metadata]'])assert(checkout.includes(marker),`Checkout abbonamento incompleto: ${marker}`);
const webhook=fs.readFileSync(path.join(root,'api/stripe-webhook.js'),'utf8');
for(const event of ['customer.subscription.','invoice.payment_failed','invoice.paid','checkout.session.completed'])assert(webhook.includes(event),`Webhook V8 incompleto: ${event}`);
const delivery=fs.readFileSync(path.join(root,'api/generate-delivery.js'),'utf8');
assert(delivery.includes('ownerUserId')&&delivery.includes('SUPABASE_ANON_KEY')&&delivery.includes('easycome-studio-v8.zip'),'Consegna V8 non inietta identità centrale');
const schema=fs.readFileSync(path.join(root,'checkout/schema.sql'),'utf8');
for(const x of ['easycome_profiles','easycome_projects','easycome_support_requests','easycome_subscriptions','managed_service_selected','custom_solution','subscriptions_own_or_admin'])assert(schema.includes(x),`Schema V8 incompleto: ${x}`);

const noImpl=projectFrom(templates[0],90);noImpl.delivery.implementationSelected=false;assert.equal(G.calculatePrice(noImpl).implementation,0);noImpl.delivery.implementationSelected=true;assert.equal(G.calculatePrice(noImpl).implementation,150);assert.equal(calculateServerPrice(noImpl).implementation,150);

await import(path.join(root,'scripts/build-public.mjs'));
for(const n of ['index.html','profilo.html','assets/v7.css','assets/profile.css','js/account.js','js/profile.js','js/app.js'])assert(fs.existsSync(path.join(root,'dist-public',n)),`Build pubblica: manca ${n}`);
for(const n of ['builder.html','js/zip.js','js/product-templates.js'])assert(!fs.existsSync(path.join(root,'dist-public',n)),`Build pubblica espone ${n}`);

const blob=globalThis.EasyZip.createZip(browserResult.files);const zipPath=path.join(root,'tests','generated-v8.zip');fs.writeFileSync(zipPath,Buffer.from(await blob.arrayBuffer()));assert(fs.statSync(zipPath).size>100000,'ZIP V8 troppo piccolo');
console.log(JSON.stringify({ok:true,version:'8.3.0',templates:results,zipPath},null,2));
