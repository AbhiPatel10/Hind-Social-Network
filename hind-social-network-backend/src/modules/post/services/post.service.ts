import { v4 as uuidv4 } from 'uuid';
import { PostRepository } from '../repositories/post.repository';
import { CreatePostDto, CreateCommentDto } from '../dtos/post.dto';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';
import { CacheAdapter } from '../../../infrastructure/cache/memory-cache';
import { Mutex } from '../../../shared/utils/mutex';
import { AppError } from '../../../shared/utils/app-error';

export class PostService {
    constructor(
        private postRepository: PostRepository,
        private cache: CacheAdapter
    ) { }

    private getUser(userId: string) {
        // Mock User Data
        const users: Record<string, { id: string; name: string; username: string; avatarUrl: string }> = {
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

    async createPost(dto: CreatePostDto): Promise<Post & { user: any; id: string }> {
        const post = new Post(
            uuidv4(),
            dto.userId,
            dto.content,
            new Date(),
            new Date(),
            0,
            0,
            0,
            dto.mediaUrls
        );

        await this.postRepository.savePost(post);
        await this.invalidateFeedCache();
        return { ...post, id: post.postId, user: this.getUser(post.userId) };
    }

    async getFeed(limit: number = 10, cursor?: string, requestingUserId?: string): Promise<{ posts: (Post & { user: any; id: string; hasLiked: boolean })[]; nextCursor: string | null }> {
        const cacheKey = `feed:${limit}:${cursor || 'start'}:${requestingUserId || 'anon'}`;
        const cached = await this.cache.get<{ posts: (Post & { user: any; id: string; hasLiked: boolean })[]; nextCursor: string | null }>(cacheKey);
        if (cached) {
            return cached;
        }

        let decodedCursor: { createdAt: Date; postId: string } | undefined;

        if (cursor) {
            try {
                const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
                decodedCursor = {
                    createdAt: new Date(decoded.createdAt),
                    postId: decoded.postId
                };
            } catch (e) {
                throw new AppError('Invalid cursor', 400);
            }
        }

        const posts = await this.postRepository.getPosts(limit, decodedCursor);

        const enrichedPosts = await Promise.all(posts.map(async p => {
            const hasLiked = requestingUserId ? await this.postRepository.existsLike(p.postId, requestingUserId) : false;
            return {
                ...p,
                id: p.postId,
                user: this.getUser(p.userId),
                hasLiked
            };
        }));

        let nextCursor: string | null = null;
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

    async getPostById(postId: string, requestingUserId?: string): Promise<Post & { user: any; id: string; hasLiked: boolean }> {
        const post = await this.postRepository.getPostById(postId);
        if (!post) {
            throw new AppError('Post not found', 404);
        }
        const hasLiked = requestingUserId ? await this.postRepository.existsLike(post.postId, requestingUserId) : false;
        return { ...post, id: post.postId, user: this.getUser(post.userId), hasLiked };
    }

    async getComments(postId: string, limit: number = 10, cursor?: string): Promise<{ comments: (Comment & { user: any; id: string })[]; nextCursor: string | null }> {
        let decodedCursor: { createdAt: Date; commentId: string } | undefined;

        if (cursor) {
            try {
                const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
                decodedCursor = {
                    createdAt: new Date(decoded.createdAt),
                    commentId: decoded.commentId
                };
            } catch (e) {
                throw new AppError('Invalid cursor', 400);
            }
        }

        const comments = await this.postRepository.getComments(postId, limit, decodedCursor);
        const enrichedComments = comments.map(c => ({ ...c, id: c.commentId, user: this.getUser(c.userId) }));

        let nextCursor: string | null = null;
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

    async likePost(postId: string, userId: string): Promise<number> {
        const lock = this.postRepository.getLock(postId);
        const release = await lock.acquire();
        try {
            // Optimistic check (in-memory is fast)
            const exists = await this.postRepository.existsLike(postId, userId);
            if (exists) {
                throw new AppError('Post already liked', 409);
            }

            const post = await this.postRepository.getPostById(postId);
            if (!post) {
                throw new AppError('Post not found', 404);
            }

            const like = new Like(uuidv4(), postId, userId, new Date());
            await this.postRepository.saveLike(like);

            post.likeCount++;
            await this.postRepository.updatePost(post);

            await this.invalidateFeedCache();
            return post.likeCount;
        } finally {
            release();
        }
    }

    async unlikePost(postId: string, userId: string): Promise<number> {
        const lock = this.postRepository.getLock(postId);
        const release = await lock.acquire();
        try {
            const removed = await this.postRepository.removeLike(postId, userId);
            if (!removed) {
                throw new AppError('Like not found', 404);
            }

            const post = await this.postRepository.getPostById(postId);
            if (post) {
                post.likeCount = Math.max(0, post.likeCount - 1);
                await this.postRepository.updatePost(post);
                await this.invalidateFeedCache();
                return post.likeCount;
            }
            return 0;
        } finally {
            release();
        }
    }

    async sharePost(postId: string, userId: string): Promise<number> {
        const lock = this.postRepository.getLock(postId);
        const release = await lock.acquire();
        try {
            const post = await this.postRepository.getPostById(postId);
            if (!post) throw new AppError('Post not found', 404);

            post.shareCount++;
            await this.postRepository.updatePost(post);
            await this.invalidateFeedCache();

            return post.shareCount;
        } finally {
            release();
        }
    }

    async addComment(postId: string, dto: CreateCommentDto): Promise<Comment & { user: any; id: string }> {
        const lock = this.postRepository.getLock(postId);
        const release = await lock.acquire();
        try {
            const post = await this.postRepository.getPostById(postId);
            if (!post) {
                throw new AppError('Post not found', 404);
            }

            const comment = new Comment(
                uuidv4(),
                postId,
                dto.userId,
                dto.content,
                new Date()
            );

            await this.postRepository.saveComment(comment);

            post.commentCount++;
            await this.postRepository.updatePost(post);
            await this.invalidateFeedCache();

            return { ...comment, id: comment.commentId, user: this.getUser(comment.userId) };
        } finally {
            release();
        }
    }

    private async invalidateFeedCache() {
        await this.cache.clear();
    }
}
