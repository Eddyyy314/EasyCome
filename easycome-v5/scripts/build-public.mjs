import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist-public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const files = [
  'index.html', 'success.html', 'cancel.html', 'orders.html', 'termini.html', 'privacy.html',
  'assets/styles.css', 'assets/editorial.css',
  'js/app.js', 'js/generator-core.js', 'js/sales-config.js', 'js/admin-config.js',
];
for (const name of files) {
  const source = path.join(root, name);
  const target = path.join(out, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
console.log(`Public build created: ${out}`);
