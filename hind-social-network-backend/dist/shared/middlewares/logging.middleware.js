"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingMiddleware = void 0;
const metrics_service_1 = require("../services/metrics.service");
const loggingMiddleware = (req, res, next) => {
    const start = Date.now();
    const metrics = metrics_service_1.MetricsService.getInstance();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const method = req.method;
        const url = req.originalUrl;
        // Log to console
        console.log(`[INFO] ${method} ${url} ${status} - ${duration}ms`);
        // Record Metrics
        metrics.recordRequest(duration, status >= 400);
        if (url.includes('/feed') && method === 'GET') {
            metrics.recordFeedRequest(duration);
        }
        if (url.includes('/like') && method === 'POST') {
            metrics.recordLikeRequest(duration);
        }
    });
    next();
};
exports.loggingMiddleware = loggingMiddleware;
