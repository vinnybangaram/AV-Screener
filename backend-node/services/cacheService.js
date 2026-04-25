const Redis = require('ioredis');
require('dotenv').config();

class CacheService {
    constructor() {
        if (process.env.REDIS_URL) {
            this.redis = new Redis(process.env.REDIS_URL, {
                retryStrategy: (times) => Math.min(times * 50, 2000),
                maxRetriesPerRequest: 3
            });
            
            this.redis.on('error', (err) => console.warn('⚠️ [Redis] Connection Error:', err.message));
            this.redis.on('connect', () => console.log('🚀 [Redis] Connected for Elite Caching'));
        } else {
            console.warn('⚠️ [Redis] No REDIS_URL found. Caching disabled.');
            this.redis = null;
        }
    }

    async get(key) {
        if (!this.redis) return null;
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (e) { return null; }
    }

    async set(key, value, ttl = 3600) {
        if (!this.redis) return;
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
        } catch (e) { /* ignore */ }
    }

    async del(pattern) {
        if (!this.redis) return;
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) await this.redis.del(...keys);
        } catch (e) { /* ignore */ }
    }

    async flush() {
        if (!this.redis) return;
        await this.redis.flushall();
        console.log('🧹 [Redis] Cache Flushed');
    }
}

module.exports = new CacheService();
