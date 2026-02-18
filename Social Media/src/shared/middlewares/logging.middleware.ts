import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metrics.service';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const metrics = MetricsService.getInstance();

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
