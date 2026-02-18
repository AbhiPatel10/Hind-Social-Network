"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const post_routes_1 = __importDefault(require("./modules/post/post.routes"));
const comment_routes_1 = __importDefault(require("./modules/comment/comment.routes"));
const like_routes_1 = __importDefault(require("./modules/like/like.routes"));
const app_error_1 = require("./shared/utils/app-error");
const rate_limit_middleware_1 = require("./shared/middlewares/rate-limit.middleware");
const logging_middleware_1 = require("./shared/middlewares/logging.middleware");
const metrics_service_1 = require("./shared/services/metrics.service");
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(rate_limit_middleware_1.rateLimiter); // Apply rate limiting globally
app.use(express_1.default.json());
app.use(logging_middleware_1.loggingMiddleware); // Replaces morgan
// Routes
app.use('/posts', post_routes_1.default);
app.use('/posts/:postId/comments', comment_routes_1.default);
app.use('/posts/:postId/like', like_routes_1.default);
// Health & Metrics
app.get('/health', (req, res) => {
    const metrics = metrics_service_1.MetricsService.getInstance().getMetrics();
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
        data: metrics_service_1.MetricsService.getInstance().getMetrics()
    });
});
// Error Handling Middleware
app.use((err, req, res, next) => {
    if (err instanceof app_error_1.AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }
    else {
        // Log unexpected errors
        console.error('Unexpected Error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});
exports.default = app;
