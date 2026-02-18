"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const rateLimitMap = new Map();
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute
const rateLimiter = (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    if (!record) {
        rateLimitMap.set(ip, { count: 1, startTime: now });
        return next();
    }
    if (now - record.startTime > WINDOW_SIZE_MS) {
        rateLimitMap.set(ip, { count: 1, startTime: now });
        return next();
    }
    if (record.count >= MAX_REQUESTS) {
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.',
        });
        return;
    }
    record.count++;
    next();
};
exports.rateLimiter = rateLimiter;
