export interface CacheAdapter {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(): Promise<void>;
}

export class MemoryCache implements CacheAdapter {
    private cache: Map<string, { value: any; expireAt: number }> = new Map();

    async get<T>(key: string): Promise<T | null> {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expireAt) {
            this.cache.delete(key);
            return null;
        }

        return item.value as T;
    }

    async set<T>(key: string, value: T, ttl: number = 60 * 1000): Promise<void> {
        const expireAt = Date.now() + ttl;
        this.cache.set(key, { value, expireAt });
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
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
