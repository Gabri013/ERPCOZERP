import { StorageProvider } from './storage.provider.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import stream from 'stream';
import { promisify } from 'util';

export interface S3Config {
  endpoint?: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

function streamToString(streamBody: any): Promise<string> {
  const pipeline = promisify(stream.pipeline);
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    streamBody.on('data', (chunk: Buffer) => chunks.push(chunk));
    streamBody.once('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    streamBody.once('error', reject);
  });
}

export default class S3Storage implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private endpoint?: string;

  constructor(cfg: S3Config) {
    const region = 'us-east-1';
    const opts: any = { region };
    if (cfg.endpoint) opts.endpoint = cfg.endpoint;
    if (cfg.accessKeyId && cfg.secretAccessKey) {
      opts.credentials = {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      };
    }
    this.client = new S3Client(opts);
    this.bucket = cfg.bucket;
    this.endpoint = cfg.endpoint;
  }

  private keyFor(name: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const base = name.endsWith('.xml') ? name.replace(/\.xml$/, '') : name;
    return `nfe/${year}/${month}/${base}.xml`;
  }

  async upload(name: string, content: string | Buffer, contentType = 'application/xml'): Promise<string> {
    const Key = this.keyFor(name);
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key, Body: content, ContentType: contentType }));
    // Construct public URL: prefer custom endpoint (R2) otherwise default S3 URL
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${Key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${Key}`;
  }

  async get(name: string): Promise<string | null> {
    // Try flat key then nested
    const candidates = [name, `${name}.xml`, this.keyFor(name)];
    for (const c of candidates) {
      const Key = c.startsWith('nfe/') ? c : c;
      try {
        const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key }));
        if (res.Body) return await streamToString(res.Body as any);
      } catch (err: any) {
        // not found -> continue
        continue;
      }
    }
    return null;
  }

  async delete(name: string): Promise<void> {
    const Key = this.keyFor(name);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key }));
  }

  async list(prefix = 'nfe'): Promise<string[]> {
    const res = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }));
    const items = res.Contents || [];
    return items.map(i => i.Key || '').filter(Boolean) as string[];
  }
}
