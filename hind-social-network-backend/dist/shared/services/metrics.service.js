"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
class MetricsService {
    constructor() {
        this.metrics = {
            totalRequests: 0,
            totalErrors: 0,
            totalLatencyMs: 0,
            feedRequests: 0,
            feedLatencyMs: 0,
            likeRequests: 0,
            likeLatencyMs: 0,
            cacheHits: 0,
            cacheMisses: 0,
            diskWrites: 0,
            startTime: Date.now()
        };
    }
    static getInstance() {
        if (!MetricsService.instance) {
            MetricsService.instance = new MetricsService();
        }
        return MetricsService.instance;
    }
    recordRequest(latencyMs, isError = false) {
        this.metrics.totalRequests++;
        this.metrics.totalLatencyMs += latencyMs;
        if (isError)
            this.metrics.totalErrors++;
    }
    recordFeedRequest(latencyMs) {
        this.metrics.feedRequests++;
        this.metrics.feedLatencyMs += latencyMs;
    }
    recordLikeRequest(latencyMs) {
        this.metrics.likeRequests++;
        this.metrics.likeLatencyMs += latencyMs;
    }
    recordCacheHit() {
        this.metrics.cacheHits++;
    }
    recordCacheMiss() {
        this.metrics.cacheMisses++;
    }
    recordDiskWrite() {
        this.metrics.diskWrites++;
    }
    getMetrics() {
        const uptime = Date.now() - this.metrics.startTime;
        const avgLatency = this.metrics.totalRequests > 0
            ? this.metrics.totalLatencyMs / this.metrics.totalRequests
            : 0;
        const avgFeedLatency = this.metrics.feedRequests > 0
            ? this.metrics.feedLatencyMs / this.metrics.feedRequests
            : 0;
        const avgLikeLatency = this.metrics.likeRequests > 0
            ? this.metrics.likeLatencyMs / this.metrics.likeRequests
            : 0;
        const cacheTotal = this.metrics.cacheHits + this.metrics.cacheMisses;
        const cacheHitRate = cacheTotal > 0 ? this.metrics.cacheHits / cacheTotal : 0;
        return {
            ...this.metrics,
            uptime,
            avgLatency,
            avgFeedLatency,
            avgLikeLatency,
            cacheHitRate,
            memoryUsage: process.memoryUsage()
        };
    }
}
exports.MetricsService = MetricsService;
