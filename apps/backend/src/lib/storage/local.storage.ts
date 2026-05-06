import { promises as fs } from 'fs';
import path from 'path';
import { StorageProvider } from './storage.provider.js';

export default class LocalStorage implements StorageProvider {
  private root = path.join(process.cwd(), 'storage');

  private computeKeyPath(key: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    // ensure key has no extension
    const base = key.endsWith('.xml') ? key.replace(/\.xml$/, '') : key;
    const relative = path.join('nfe', String(year), String(month), `${base}.xml`);
    const absolute = path.join(this.root, relative);
    return { relative: relative.replace(/\\/g, '/'), absolute };
  }

  async upload(key: string, content: string | Buffer): Promise<string> {
    const { absolute, relative } = this.computeKeyPath(key);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, content);
    // Return file:// URL to the absolute path
    return `file://${absolute}`;
  }

  async get(key: string): Promise<string | null> {
    // Try both with and without path prefixes
    const candidates = [
      path.join(this.root, 'nfe', key.endsWith('.xml') ? key : `${key}.xml`),
    ];
    for (const c of candidates) {
      try {
        const data = await fs.readFile(c, 'utf8');
        return data;
      } catch (err: any) {
        if (err.code === 'ENOENT') continue;
        throw err;
      }
    }
    // If not found in flat nfe root, try nested by year/month
    try {
      const base = key.endsWith('.xml') ? key.replace(/\.xml$/, '') : key;
      const files: string[] = await this.walkNfeFiles();
      const found = files.find(f => f.endsWith(`/${base}.xml`) || f.endsWith(`\\${base}.xml`));
      if (found) {
        const absolute = path.join(this.root, found);
        const data = await fs.readFile(absolute, 'utf8');
        return data;
      }
    } catch (err) {
      // ignore
    }
    return null;
  }

  private async walkNfeFiles(): Promise<string[]> {
    const results: string[] = [];
    const nfeRoot = path.join(this.root, 'nfe');
    async function walk(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) await walk(full);
          else results.push(path.relative(nfeRoot, full));
        }
      } catch (err) {
        // ignore
      }
    }
    await walk(nfeRoot);
    return results.map(r => path.join('nfe', r).replace(/\\/g, '/'));
  }

  async delete(key: string): Promise<void> {
    const file = path.join(this.root, 'nfe', key.endsWith('.xml') ? key : `${key}.xml`);
    try {
      await fs.unlink(file);
    } catch (err: any) {
      if (err.code === 'ENOENT') return;
      throw err;
    }
  }

  async list(prefix = 'nfe'): Promise<string[]> {
    const nfeRoot = path.join(this.root, 'nfe');
    const files = await this.walkNfeFiles();
    return files.map(f => f.replace(/\\/g, '/'));
  }
}
