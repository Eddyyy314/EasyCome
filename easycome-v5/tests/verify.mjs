import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
globalThis.window = globalThis;
for (const file of ['js/zip.js', 'js/product-templates.js', 'js/generator-core.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}
const G = globalThis.ECGenerator;
const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const match = appSource.match(/const TEMPLATES = (\[[\s\S]*?\n  \]);/);
assert(match, 'Impossibile leggere i modelli dal configuratore');
const templates = vm.runInNewContext(`(${match[1]})`);
assert.equal(templates.length, 9, 'Il catalogo deve contenere 9 modelli');

function projectFrom(template, index) {
  const p = G.defaultProject();
  p.company.name = `Impresa Test ${index + 1}`;
  p.company.slug = `impresa-test-${index + 1}`;
  p.company.industry = template.industry || 'Impresa personalizzata';
  p.company.description = template.description || 'Gestionale operativo personalizzato per centralizzare dati, attività e processi aziendali quotidiani.';
  if (p.company.description.length < 35) p.company.description += ' con un flusso operativo chiaro e verificabile.';
  p.company.email = `titolare${index + 1}@example.com`;
  p.modules = [...new Set(template.modules || ['crm', 'tasks'])];
  p.customEntities = structuredClone(template.custom || []);
  if (template.portal) p.portal = { ...p.portal, enabled: true, ...template.portal };
  if (template.pricing) { p.pricing.enabled = true; p.pricing.basePrice = 50; p.pricing.rules = [{ type: 'duration_discount', name: 'Sconto durata', min: 7, percent: 5 }]; }
  p.delivery.previewApproved = true;
  return p;
}

const results = [];
for (const [index, template] of templates.entries()) {
  const project = projectFrom(template, index);
  const audit = G.auditProject(project);
  assert.equal(audit.blockers.length, 0, `${template.name}: problemi bloccanti: ${audit.blockers.join(' | ')}`);
  assert(audit.score >= 82, `${template.name}: punteggio qualità insufficiente (${audit.score})`);
  const result = G.generatePackage(project);
  assert(result.files.length >= 32, `${template.name}: numero file insufficiente (${result.files.length})`);
  assert.equal(new Set(result.files.map((file) => file.name)).size, result.files.length, `${template.name}: nomi file duplicati`);
  const byName = Object.fromEntries(result.files.map((file) => [file.name, file.data]));
  for (const required of ['index.html', 'portal.html', 'js/app.js', 'js/portal.js', 'supabase/schema.sql', '04-RAPPORTO-QUALITA.md', '06-PRIMA-DELLA-CONSEGNA.md', 'Excel/LEGGIMI.md']) assert(required in byName, `${template.name}: manca ${required}`);
  new Function(byName['js/app.js']);
  new Function(byName['js/portal.js']);
  new Function(byName['sw.js']);
  const workbookName = Object.keys(byName).find((name) => name.endsWith('.xlsx'));
  assert(workbookName, `${template.name}: workbook Excel mancante`);
  assert(byName[workbookName] instanceof Uint8Array, `${template.name}: workbook non binario`);
  assert.equal(byName[workbookName][0], 0x50, `${template.name}: workbook ZIP non valido`);
  assert(byName['js/app.js'].includes('renderSheet') && byName['js/app.js'].includes('renderAvailability'), `${template.name}: viste operative avanzate mancanti`);
  const schema = byName['supabase/schema.sql'];
  for (const expected of ['enable row level security', 'claim_owner_by_email', 'submit_public_request', 'public_submission_limits', 'audit_log', 'easycome-documents']) assert(schema.includes(expected), `${template.name}: schema incompleto (${expected})`);
  results.push({ template: template.name, score: audit.score, files: result.files.length, total: result.price.total });
}

const multisite = G.defaultProject();
multisite.company = { ...multisite.company, name: 'Multi Sede Test', description: 'Gestione coordinata di più sedi e dati operativi attribuiti alla sede corretta.', email: 'owner@example.com' };
multisite.modules = ['crm', 'tasks', 'multisite', 'projects'];
multisite.delivery.previewApproved = true;
const multisiteEntities = G.buildEntities(multisite);
assert(multisiteEntities.find((entity) => entity.key === 'customers').fields.some((field) => field.key === 'location_name'), 'Il modulo multisede deve aggiungere il campo sede');
assert(multisiteEntities.find((entity) => entity.key === 'tasks').fields.some((field) => field.key === 'project_name'), 'Il modulo progetti deve collegare le attività');

const zipProject = projectFrom(templates[1], 99);
const packageResult = G.generatePackage(zipProject);
const blob = globalThis.EasyZip.createZip(packageResult.files);
const zipPath = path.join(root, 'tests', 'generated-test.zip');
fs.writeFileSync(zipPath, Buffer.from(await blob.arrayBuffer()));
assert(fs.statSync(zipPath).size > 10_000, 'ZIP di test troppo piccolo');

console.log(JSON.stringify({ ok: true, templates: results, zipPath }, null, 2));


// Verifiche Easy Come 4.0 — preparazione e checkout
for (const file of [
  'assets/editorial.css', 'success.html', 'cancel.html', 'orders.html',
  'api/create-checkout-session.js', 'api/stripe-webhook.js', 'api/checkout-status.js',
  'api/_pricing.js', 'checkout/schema.sql', 'CHECKOUT_SETUP.md', '.env.example'
]) assert(fs.existsSync(path.join(root, file)), `Manca il file checkout ${file}`);

const salesConfig = fs.readFileSync(path.join(root, 'js/sales-config.js'), 'utf8');
assert(salesConfig.includes("mode: 'customer'"), 'La versione pubblica deve partire in modalità customer');
assert(salesConfig.includes('generationSeconds: 0'), 'La preparazione pubblica non deve mostrare un timer fisso');
assert(salesConfig.includes("checkoutEndpoint: '/api/create-checkout-session'"), 'Endpoint checkout mancante');
assert(appSource.includes('PREPARATION_STAGES'), 'Sequenza di preparazione mancante');
assert(appSource.includes('runPreparation'), 'Motore di preparazione mancante');
assert(appSource.includes('openCheckout'), 'Checkout frontend mancante');

const { calculateServerPrice } = await import(path.join(root, 'api/_pricing.js'));
for (const [index, template] of templates.entries()) {
  const p = projectFrom(template, index);
  const browserPrice = G.calculatePrice(p);
  const serverPrice = calculateServerPrice(p);
  assert.equal(serverPrice.total, browserPrice.total, `${template.name}: prezzo frontend e server non coincidono`);
}

const checkoutSchema = fs.readFileSync(path.join(root, 'checkout/schema.sql'), 'utf8');
for (const expected of ['easycome_orders', 'easycome_admins', 'enable row level security', 'is_easycome_admin']) assert(checkoutSchema.includes(expected), `Schema checkout incompleto: ${expected}`);

const noImplementation = projectFrom(templates[0], 500);
const baseOnlyBrowser = G.calculatePrice(noImplementation);
const baseOnlyServer = calculateServerPrice(noImplementation);
assert.equal(baseOnlyBrowser.implementation, 0, 'L’implementazione non deve essere inclusa automaticamente nel frontend');
assert.equal(baseOnlyServer.implementation, 0, 'L’implementazione non deve essere inclusa automaticamente nel server');
noImplementation.delivery.implementationSelected = true;
assert.equal(G.calculatePrice(noImplementation).implementation, 150, 'L’implementazione opzionale deve costare 150 euro');
assert.equal(calculateServerPrice(noImplementation).implementation, 150, 'Il server deve applicare l’implementazione solo se selezionata');
assert(appSource.includes('process-spinner'), 'La preparazione deve mostrare una rotellina');
assert(!appSource.includes('processTimer'), 'Il timer visibile deve essere eliminato');
assert(!appSource.includes('summary-preview'), 'La card promozionale laterale deve essere eliminata');
console.log(JSON.stringify({ checkout: true, spinner: true, optionalImplementation: true, serverPricingVerified: templates.length }, null, 2));


const publicIndex = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(!publicIndex.includes('js/zip.js'), 'Il sito pubblico non deve caricare zip.js');
assert(!publicIndex.includes('js/product-templates.js'), 'Il sito pubblico non deve caricare i template di generazione');
const builderIndex = fs.readFileSync(path.join(root, 'builder.html'), 'utf8');
assert(builderIndex.includes('js/zip.js') && builderIndex.includes('js/product-templates.js'), 'Il Builder interno deve mantenere il motore completo');

const { verifyStripeSignature } = await import(path.join(root, 'api/_stripe.js'));
const crypto = await import('node:crypto');
const webhookBody = Buffer.from(JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' }));
const timestamp = Math.floor(Date.now() / 1000);
const webhookSecret = 'whsec_test_secret';
const signature = crypto.createHmac('sha256', webhookSecret).update(`${timestamp}.${webhookBody.toString('utf8')}`).digest('hex');
verifyStripeSignature(webhookBody, `t=${timestamp},v1=${signature}`, webhookSecret);
assert.throws(() => verifyStripeSignature(Buffer.from('altered'), `t=${timestamp},v1=${signature}`, webhookSecret), /non valida/);

await import(path.join(root, 'scripts/build-public.mjs'));
for (const required of ['index.html','success.html','cancel.html','assets/editorial.css','js/app.js']) assert(fs.existsSync(path.join(root,'dist-public',required)), `Build pubblica: manca ${required}`);
for (const forbidden of ['builder.html','js/zip.js','js/product-templates.js']) assert(!fs.existsSync(path.join(root,'dist-public',forbidden)), `Build pubblica: file interno esposto ${forbidden}`);
