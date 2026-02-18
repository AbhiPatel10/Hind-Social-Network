"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeRepository = void 0;
const metrics_service_1 = require("../../../shared/services/metrics.service");
class LikeRepository {
    constructor(storage) {
        this.storage = storage;
        this.likesFile = 'likes.json';
        this.likes = new Map(); // postId -> Set<userId>
        this.writeBuffer = false;
        this.initialize();
        this.flushInterval = setInterval(() => this.flush(), 5000);
        process.on('SIGINT', async () => {
            await this.flush();
            process.exit(0);
        });
    }
    async initialize() {
        const likes = await this.storage.read(this.likesFile) || [];
        likes.forEach(l => {
            if (!this.likes.has(l.postId))
                this.likes.set(l.postId, new Set());
            this.likes.get(l.postId)?.add(l.userId);
        });
    }
    async flush() {
        if (this.writeBuffer) {
            const allLikes = [];
            this.likes.forEach((userIds, postId) => {
                userIds.forEach(userId => {
                    allLikes.push({ likeId: 'generated-on-read', postId, userId, createdAt: new Date() });
                });
            });
            await this.storage.write(this.likesFile, allLikes);
            this.writeBuffer = false;
            metrics_service_1.MetricsService.getInstance().recordDiskWrite();
        }
    }
    async saveLike(like) {
        if (!this.likes.has(like.postId)) {
            this.likes.set(like.postId, new Set());
        }
        this.likes.get(like.postId)?.add(like.userId);
        this.writeBuffer = true;
    }
    async removeLike(postId, userId) {
        if (this.likes.has(postId)) {
            const deleted = this.likes.get(postId)?.delete(userId);
            if (deleted) {
                this.writeBuffer = true;
                return true;
            }
        }
        return false;
    }
    async existsLike(postId, userId) {
        return this.likes.get(postId)?.has(userId) || false;
    }
}
exports.LikeRepository = LikeRepository;
