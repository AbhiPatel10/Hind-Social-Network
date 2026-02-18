import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import postRouter from './modules/post/post.routes';
import commentRouter from './modules/comment/comment.routes';
import likeRouter from './modules/like/like.routes';
import { AppError } from './shared/utils/app-error';

import { rateLimiter } from './shared/middlewares/rate-limit.middleware';
import { loggingMiddleware } from './shared/middlewares/logging.middleware';
import { MetricsService } from './shared/services/metrics.service';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(rateLimiter); // Apply rate limiting globally
app.use(express.json());
app.use(loggingMiddleware); // Replaces morgan

// Routes
app.use('/posts', postRouter);
app.use('/posts/:postId/comments', commentRouter);
app.use('/posts/:postId/like', likeRouter);

// Health & Metrics
app.get('/health', (req, res) => {
    const metrics = MetricsService.getInstance().getMetrics();
    res.status(200).json({
        success: true,
        message: 'System healthy',
        data: {
            uptime: metrics.uptime,
            memoryUsage: metrics.memoryUsage,
            version: '1.0.0'
        }
    });
});

app.get('/metrics', (req, res) => {
    res.status(200).json({
        success: true,
        data: MetricsService.getInstance().getMetrics()
    });
});

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    } else {
        // Log unexpected errors
        console.error('Unexpected Error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

export default app;
