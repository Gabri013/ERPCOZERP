const redis = require('redis');
const { promisify } = require('util');

class CacheService {
  constructor() {
    this.client = null;
    this.enabled = process.env.REDIS_URL || process.env.NODE_ENV === 'production';
  }

  async connect() {
    if (!this.enabled) {
      console.log('Cache desabilitado (modo development/local)');
      return;
    }

    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      this.client.on('error', (err) => console.error('Redis Client Error:', err));
      this.client.on('connect', () => console.log('✅ Redis conectado'));
      
      await this.client.connect();
      
      this.getAsync = promisify(this.client.get).bind(this.client);
      this.setAsync = promisify(this.client.set).bind(this.client);
      this.delAsync = promisify(this.client.del).bind(this.client);
      this.keysAsync = promisify(this.client.keys).bind(this.client);
      this.flushAsync = promisify(this.client.flushdb).bind(this.client);
    } catch (err) {
      console.error('❌ Erro ao conectar Redis:', err.message);
      this.enabled = false;
      this.client = null;
    }
  }

  async get(key) {
    if (!this.enabled || !this.client) return null;
    try {
      return await this.getAsync(key);
    } catch (err) {
      console.error('Cache get error:', err.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.enabled || !this.client) return;
    try {
      await this.setAsync(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.error('Cache set error:', err.message);
    }
  }

  async del(key) {
    if (!this.enabled || !this.client) return;
    try {
      await this.delAsync(key);
    } catch (err) {
      console.error('Cache del error:', err.message);
    }
  }

  async invalidatePattern(pattern) {
    if (!this.enabled || !this.client) return;
    try {
      const keys = await this.keysAsync(pattern);
      if (keys.length > 0) {
        await this.client.unlink(keys);
      }
    } catch (err) {
      console.error('Cache invalidate error:', err.message);
    }
  }

  // Invalida cache de metadados
  async invalidateEntityCache(entityCode) {
    await this.invalidatePattern(`entity:${entityCode}:*`);
    await this.invalidatePattern('entities:list');
  }

  // Invalida cache de regras
  async invalidateRulesCache(entityId) {
    await this.invalidatePattern(`rules:${entityId}:*`);
  }

  // Invalida cache de workflow
  async invalidateWorkflowCache(entityId) {
    await this.invalidatePattern(`workflow:${entityId}:*`);
  }
}

module.exports = new CacheService();
