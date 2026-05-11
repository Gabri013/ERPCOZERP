import Redis from 'ioredis';

const redis = process.env.REDIS_URL
  ? (() => {
      const client = new Redis(process.env.REDIS_URL);
      // Avoid crashing the process when Redis is unavailable in local/dev.
      client.on('error', (err: unknown) => {
        console.warn('Redis unavailable, cache running in degraded mode:', err);
      });
      return client;
    })()
  : null;

export interface CacheOptions {
  ttl?: number; // in seconds
}

export class Cache {
  private redis: Redis | null;

  constructor(redisInstance: Redis | null) {
    this.redis = redisInstance;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.error('Cache get error:', err);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    if (!this.redis) return;
    try {
      const serialized = JSON.stringify(value);
      if (options?.ttl) {
        await this.redis.setex(key, options.ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (err) {
      console.error('Cache set error:', err);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch (err) {
      console.error('Cache del error:', err);
    }
  }

  async clear(pattern: string): Promise<void> {
    if (!this.redis) return;
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      console.error('Cache clear error:', err);
    }
  }
}

export const cache = new Cache(redis);