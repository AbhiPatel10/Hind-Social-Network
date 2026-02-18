"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const uuid_1 = require("uuid");
const comment_entity_1 = require("../entities/comment.entity");
const app_error_1 = require("../../../shared/utils/app-error");
class CommentService {
    constructor(commentRepository, postRepository, cache) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.cache = cache;
    }
    getUser(userId) {
        // Mock User Data - In real app, this would come from UserRepository
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
    async addComment(postId, dto) {
        const lock = this.postRepository.getLock(postId);
        const release = await lock.acquire();
        try {
            const post = await this.postRepository.getPostById(postId);
            if (!post) {
                throw new app_error_1.AppError('Post not found', 404);
            }
            const comment = new comment_entity_1.Comment((0, uuid_1.v4)(), postId, dto.userId, dto.content, new Date());
            await this.commentRepository.saveComment(comment);
            post.commentCount++;
            await this.postRepository.updatePost(post);
            await this.cache.clear(); // Invalidate feed cache
            return { ...comment, id: comment.commentId, user: this.getUser(comment.userId) };
        }
        finally {
            release();
        }
    }
    async getComments(postId, limit = 10, cursor) {
        let decodedCursor;
        if (cursor) {
            try {
                const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
                decodedCursor = {
                    createdAt: new Date(decoded.createdAt),
                    commentId: decoded.commentId
                };
            }
            catch (e) {
                throw new app_error_1.AppError('Invalid cursor', 400);
            }
        }
        const comments = await this.commentRepository.getComments(postId, limit, decodedCursor);
        const enrichedComments = comments.map(c => ({ ...c, id: c.commentId, user: this.getUser(c.userId) }));
        let nextCursor = null;
        if (comments.length === limit) {
            const lastComment = comments[comments.length - 1];
            const cursorObj = {
                createdAt: lastComment.createdAt,
                commentId: lastComment.commentId
            };
            nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
        }
        return { comments: enrichedComments, nextCursor };
    }
}
exports.CommentService = CommentService;
