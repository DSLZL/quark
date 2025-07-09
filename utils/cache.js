// Simple in-memory cache with a TTL (Time-To-Live)
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class Cache {
    constructor(ttl) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    get(key) {
        const item = this.cache.get(key);
        if (item && (Date.now() - item.timestamp < this.ttl)) {
            return item.data;
        }
        this.cache.delete(key); // Delete expired item
        return null;
    }

    set(key, value) {
        this.cache.set(key, {
            timestamp: Date.now(),
            data: value,
        });
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
    
    // Clean up expired cache items occasionally
    cleanup() {
        if (Math.random() < 0.1) {
            for (const [key, value] of this.cache.entries()) {
                if (Date.now() - value.timestamp > this.ttl) {
                    this.cache.delete(key);
                }
            }
        }
    }
}

export default new Cache(CACHE_TTL);
