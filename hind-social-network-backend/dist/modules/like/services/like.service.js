"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeService = void 0;
const uuid_1 = require("uuid");
const like_entity_1 = require("../entities/like.entity");
const app_error_1 = require("../../../shared/utils/app-error");
class LikeService {
    constructor(likeRepository, postRepository, cache) {
        this.likeRepository = likeRepository;
        this.postRepository = postRepository;
        this.cache = cache;
    }
    async likePost(postId, userId) {
        const lock = this.postRepository.getLock(postId);
        const release = await lock.acquire();
        try {
            // Optimistic check (in-memory is fast)
            const exists = await this.likeRepository.existsLike(postId, userId);
            if (exists) {
                throw new app_error_1.AppError('Post already liked', 409);
            }
            const post = await this.postRepository.getPostById(postId);
            if (!post) {
                throw new app_error_1.AppError('Post not found', 404);
            }
            const like = new like_entity_1.Like((0, uuid_1.v4)(), postId, userId, new Date());
            await this.likeRepository.saveLike(like);
            post.likeCount++;
            await this.postRepository.updatePost(post);
            await this.cache.clear(); // Invalidate feed cache
            return post.likeCount;
        }
        finally {
            release();
        }
    }
    async unlikePost(postId, userId) {
        const lock = this.postRepository.getLock(postId);
        const release = await lock.acquire();
        try {
            const removed = await this.likeRepository.removeLike(postId, userId);
            if (!removed) {
                throw new app_error_1.AppError('Like not found', 404);
            }
            const post = await this.postRepository.getPostById(postId);
            if (post) {
                post.likeCount = Math.max(0, post.likeCount - 1);
                await this.postRepository.updatePost(post);
                await this.cache.clear(); // Invalidate feed cache
                return post.likeCount;
            }
            return 0;
        }
        finally {
            release();
        }
    }
}
exports.LikeService = LikeService;
