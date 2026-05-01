import Redis from 'ioredis';
import { env } from '../config/env.js';

let client: Redis | null = null;

export async function redisPingDetailed(): Promise<{ ok: boolean; detail: string }> {
  if (!env.REDIS_URL) {
    return { ok: false, detail: 'REDIS_URL not configured' };
  }
  try {
    if (!client) {
      client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
      });
    }
    const pong = await client.ping();
    return { ok: pong === 'PONG', detail: pong };
  } catch (e: any) {
    return { ok: false, detail: e?.message || 'redis_ping_failed' };
  }
}
