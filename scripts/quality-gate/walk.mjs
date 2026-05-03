import fs from 'node:fs';
import path from 'node:path';

export function collectFilesRecursive(rootDir, { extTests } = {}) {
  const results = [];

  function walk(abs) {
    const base = path.basename(abs);
    if (base === 'node_modules' || base === 'dist' || base === '__tests__' || base === '.git')
      return;
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      return;
    }
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(abs)) walk(path.join(abs, name));
      return;
    }
    const ext = path.extname(abs);
    if (Array.isArray(extTests) ? extTests.includes(ext) : true) results.push(abs);
  }

  walk(rootDir);
  return results.sort();
}
