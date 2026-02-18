"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRepository = void 0;
const metrics_service_1 = require("../../../shared/services/metrics.service");
class CommentRepository {
    constructor(storage) {
        this.storage = storage;
        this.commentsFile = 'comments.json';
        this.comments = new Map(); // postId -> comments
        this.writeBuffer = false;
        this.initialize();
        this.flushInterval = setInterval(() => this.flush(), 5000);
        process.on('SIGINT', async () => {
            await this.flush();
            process.exit(0);
        });
    }
    async initialize() {
        const comments = await this.storage.read(this.commentsFile) || [];
        comments.forEach(c => {
            const comment = { ...c, createdAt: new Date(c.createdAt) };
            if (!this.comments.has(c.postId))
                this.comments.set(c.postId, []);
            this.comments.get(c.postId)?.push(comment);
        });
    }
    async flush() {
        if (this.writeBuffer) {
            const allComments = Array.from(this.comments.values()).flat();
            await this.storage.write(this.commentsFile, allComments);
            this.writeBuffer = false;
            metrics_service_1.MetricsService.getInstance().recordDiskWrite();
        }
    }
    async saveComment(comment) {
        if (!this.comments.has(comment.postId)) {
            this.comments.set(comment.postId, []);
        }
        const list = this.comments.get(comment.postId);
        list.unshift(comment); // Keep sorted by newest
        this.writeBuffer = true;
    }
    async getComments(postId, limit, cursor) {
        const postComments = this.comments.get(postId) || [];
        if (!cursor) {
            return postComments.slice(0, limit);
        }
        const cursorTime = cursor.createdAt.getTime();
        const startIndex = postComments.findIndex(c => {
            const cTime = c.createdAt.getTime();
            return cTime < cursorTime || (cTime === cursorTime && c.commentId < cursor.commentId);
        });
        if (startIndex === -1)
            return [];
        return postComments.slice(startIndex, startIndex + limit);
    }
}
exports.CommentRepository = CommentRepository;
