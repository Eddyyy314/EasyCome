import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist-public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const files = [
  'index.html', 'studio.html', 'accedi.html', 'profilo.html', 'success.html', 'cancel.html', 'admin.html', 'factory.html', 'demo.html', 'web-demo.html', 'orders.html', 'termini.html', 'rimborsi.html', 'recesso.html', 'privacy.html', 'cookie.html',
  'assets/styles.css', 'assets/privacy.css', 'assets/editorial.css', 'assets/v7.css', 'assets/polish.css', 'assets/profile.css', 'assets/admin.css', 'assets/auth.css', 'assets/factory.css', 'assets/demo-live.css', 'assets/web-demo.css',
  'js/legal-config.js', 'js/legal-page.js', 'js/recesso.js', 'js/privacy-consent.js', 'js/auth-page.js', 'js/account.js', 'js/profile.js', 'js/app.js', 'js/website-builder.js', 'js/generator-core.js', 'js/sales-config.js', 'js/admin-config.js', 'js/admin.js', 'js/factory.js', 'js/demo-live.js', 'js/web-demo.js',
];
for (const name of files) {
  const source = path.join(root, name);
  const target = path.join(out, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
console.log(`Public build created: ${out}`);
