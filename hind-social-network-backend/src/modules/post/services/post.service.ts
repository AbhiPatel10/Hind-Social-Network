import { v4 as uuidv4 } from 'uuid';
import { PostRepository } from '../repositories/post.repository';
import { LikeRepository } from '../../like/repositories/like.repository';
import { CreatePostDto } from '../dtos/post.dto';
import { Post } from '../entities/post.entity';
import { CacheAdapter } from '../../../infrastructure/cache/memory-cache';
import { User } from '../../../shared/interfaces/user.interface';
import { AppError } from '../../../shared/utils/app-error';

export class PostService {
    constructor(
        private postRepository: PostRepository,
        private likeRepository: LikeRepository,
        private cache: CacheAdapter
    ) { }

    private getUser(userId: string): User {
        // Mock User Data
        const users: Record<string, User> = {
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

    async createPost(dto: CreatePostDto): Promise<Post & { user: User; id: string }> {
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

    async getFeed(limit: number = 10, cursor?: string, requestingUserId?: string, searchQuery?: string): Promise<{ posts: (Post & { user: User; id: string; hasLiked: boolean })[]; nextCursor: string | null }> {
        const cacheKey = `feed:${limit}:${cursor || 'start'}:${requestingUserId || 'anon'}:${searchQuery || 'all'}`;
        const cached = await this.cache.get<{ posts: (Post & { user: User; id: string; hasLiked: boolean })[]; nextCursor: string | null }>(cacheKey);
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

        const posts = await this.postRepository.getPosts(limit, decodedCursor, searchQuery);

        const enrichedPosts = await Promise.all(posts.map(async p => {
            const hasLiked = requestingUserId ? await this.likeRepository.existsLike(p.postId, requestingUserId) : false;
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

    async getPostById(postId: string, requestingUserId?: string): Promise<Post & { user: User; id: string; hasLiked: boolean }> {
        const post = await this.postRepository.getPostById(postId);
        if (!post) {
            throw new AppError('Post not found', 404);
        }
        const hasLiked = requestingUserId ? await this.likeRepository.existsLike(post.postId, requestingUserId) : false;
        return { ...post, id: post.postId, user: this.getUser(post.userId), hasLiked };
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

    private async invalidateFeedCache() {
        await this.cache.clear();
    }
}
