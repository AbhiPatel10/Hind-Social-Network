"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const uuid_1 = require("uuid");
const post_entity_1 = require("../entities/post.entity");
const app_error_1 = require("../../../shared/utils/app-error");
class PostService {
    constructor(postRepository, likeRepository, cache) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.cache = cache;
    }
    getUser(userId) {
        // Mock User Data
        const users = {
            'user-1': {
                id: 'user-1',
                name: 'Abhi Patel',
                username: 'abhipatel',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abhi'
            },
            'user-2': {
                id: 'user-2',
                name: 'Jane Doe',
                username: 'janedoe',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
            },
            'default': {
                id: 'user-x',
                name: 'Anonymous',
                username: 'anonymous',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anonymous'
            }
        };
        return users[userId] || users['default'];
    }
    async createPost(dto) {
        const post = new post_entity_1.Post((0, uuid_1.v4)(), dto.userId, dto.content, new Date(), new Date(), 0, 0, 0, dto.mediaUrls);
        await this.postRepository.savePost(post);
        await this.invalidateFeedCache();
        return { ...post, id: post.postId, user: this.getUser(post.userId) };
    }
    async getFeed(limit = 10, cursor, requestingUserId, searchQuery) {
        const cacheKey = `feed:${limit}:${cursor || 'start'}:${requestingUserId || 'anon'}:${searchQuery || 'all'}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        let decodedCursor;
        if (cursor) {
            try {
                const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
                decodedCursor = {
                    createdAt: new Date(decoded.createdAt),
                    postId: decoded.postId
                };
            }
            catch (e) {
                throw new app_error_1.AppError('Invalid cursor', 400);
            }
        }
        const posts = await this.postRepository.getPosts(limit, decodedCursor, searchQuery);
        const enrichedPosts = await Promise.all(posts.map(async (p) => {
            const hasLiked = requestingUserId ? await this.likeRepository.existsLike(p.postId, requestingUserId) : false;
            return {
                ...p,
                id: p.postId,
                user: this.getUser(p.userId),
                hasLiked
            };
        }));
        let nextCursor = null;
        if (posts.length === limit) {
            const lastPost = posts[posts.length - 1];
            const cursorObj = {
                createdAt: lastPost.createdAt,
                postId: lastPost.postId
            };
            nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
        }
        const result = { posts: enrichedPosts, nextCursor };
        await this.cache.set(cacheKey, result, 60 * 1000); // Cache for 1 minute
        return result;
    }
    async getPostById(postId, requestingUserId) {
        const post = await this.postRepository.getPostById(postId);
        if (!post) {
            throw new app_error_1.AppError('Post not found', 404);
        }
        const hasLiked = requestingUserId ? await this.likeRepository.existsLike(post.postId, requestingUserId) : false;
        return { ...post, id: post.postId, user: this.getUser(post.userId), hasLiked };
    }
    async sharePost(postId, userId) {
        const lock = this.postRepository.getLock(postId);
        const release = await lock.acquire();
        try {
            const post = await this.postRepository.getPostById(postId);
            if (!post)
                throw new app_error_1.AppError('Post not found', 404);
            post.shareCount++;
            await this.postRepository.updatePost(post);
            await this.invalidateFeedCache();
            return post.shareCount;
        }
        finally {
            release();
        }
    }
    async invalidateFeedCache() {
        await this.cache.clear();
    }
}
exports.PostService = PostService;
