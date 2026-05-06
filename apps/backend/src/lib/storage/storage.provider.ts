import LocalStorage from './local.storage.js';
import S3Storage from './s3.storage.js';

export interface StorageProvider {
  upload(key: string, content: string | Buffer, contentType?: string): Promise<string>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (provider) return provider;

  // If S3 bucket or endpoint is configured, use S3 provider (supports R2)
  if (process.env.S3_BUCKET || process.env.S3_ENDPOINT) {
    provider = new S3Storage({
      endpoint: process.env.S3_ENDPOINT || '',
      bucket: process.env.S3_BUCKET || '',
      accessKeyId: process.env.S3_KEY || '',
      secretAccessKey: process.env.S3_SECRET || '',
    });
  } else {
    provider = new LocalStorage();
  }

  return provider;
}

export default StorageProvider;
