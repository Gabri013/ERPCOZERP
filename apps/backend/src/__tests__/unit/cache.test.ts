import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Redis from 'ioredis';
import { Cache } from '../../lib/cache.js';

const { mockRedis } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  },
}));

vi.mock('ioredis', () => ({
  default: function RedisMock() {
    return mockRedis;
  },
}));

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    vi.clearAllMocks();
    cache = new Cache(mockRedis as unknown as Redis);
  });

  describe('get', () => {
    it('should return parsed JSON data when key exists', async () => {
      const testData = { message: 'hello' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cache.get('test-key');
      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cache.get('test-key');
      expect(result).toBeNull();
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      const result = await cache.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set data without TTL', async () => {
      const testData = { message: 'hello' };

      await cache.set('test-key', testData);

      expect(mockRedis.set).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
    });

    it('should set data with TTL', async () => {
      const testData = { message: 'hello' };

      await cache.set('test-key', testData, { ttl: 300 });

      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(testData));
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      await cache.del('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('clear', () => {
    it('should delete all keys matching pattern', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2']);

      await cache.clear('pattern*');

      expect(mockRedis.keys).toHaveBeenCalledWith('pattern*');
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should handle empty key list', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await cache.clear('pattern*');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});