const fs = require('fs');
const glob = require('glob');
const routeFiles = glob.sync('apps/backend/src/**/*.{ts,js}', { ignore: ['**/*.d.ts'] });
const permUses = new Set();
routeFiles.forEach((file) => {
  const txt = fs.readFileSync(file, 'utf8');
  const re = /requirePermission\((\[[^\)]*\]|[^\)]+?)\)/g;
  let m;
  while ((m = re.exec(txt))) {
    const raw = m[1].trim();
    if (raw.startsWith('[')) {
      try {
        const arr = eval(raw);
        arr.forEach((s) => permUses.add(s));
      } catch (e) {}
    } else {
      let s = raw.replace(/^['\"]|['\"]$/g, '').trim();
      if (s) permUses.add(s);
    }
  }
});
const seed = fs.readFileSync('apps/backend/prisma/seed.ts', 'utf8');
const codes = new Set();
seed.replace(/\{\s*code:\s*'([^']+)'/g, (_, code) => codes.add(code));
const entMatch = seed.match(/const GRANULAR_ENTITY_CODES\s*=\s*\[([\s\S]*?)\]/);
if (entMatch) {
  const entList = (entMatch[1].match(/'([^']+)'/g) || []).map((x) => x.replace(/'/g, ''));
  entList.forEach((e) => ['view', 'create', 'edit', 'delete'].forEach((s) => codes.add(`${e}.${s}`)));
}
const missing = [...permUses].filter((p) => !codes.has(p)).sort();
console.log('MISSING:' + missing.join('|||'));
console.log('TOTAL_ROUTE_CODES:' + permUses.size);
console.log('TOTAL_SEED_CODES:' + codes.size);
