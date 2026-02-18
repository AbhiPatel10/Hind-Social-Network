"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = void 0;
class MemoryCache {
    constructor() {
        this.cache = new Map();
    }
    async get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expireAt) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttl = 60 * 1000) {
        const expireAt = Date.now() + ttl;
        this.cache.set(key, { value, expireAt });
    }
    async del(key) {
        this.cache.delete(key);
    }
    async clear() {
        this.cache.clear();
    }
    // Clean up expired items periodically (optional optimization)
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expireAt) {
                this.cache.delete(key);
            }
        }
    }
}
exports.MemoryCache = MemoryCache;
