import { v4 as uuidv4 } from 'uuid';
import { LikeRepository } from '../repositories/like.repository';
import { PostRepository } from '../../post/repositories/post.repository';
import { CacheAdapter } from '../../../infrastructure/cache/memory-cache';
import { Like } from '../entities/like.entity';
import { AppError } from '../../../shared/utils/app-error';

export class LikeService {
    constructor(
        private likeRepository: LikeRepository,
        private postRepository: PostRepository,
        private cache: CacheAdapter
    ) { }

    async likePost(postId: string, userId: string): Promise<number> {
        const lock = this.postRepository.getLock(postId);
        const release = await lock.acquire();
        try {
            // Optimistic check (in-memory is fast)
            const exists = await this.likeRepository.existsLike(postId, userId);
            if (exists) {
                throw new AppError('Post already liked', 409);
            }

            const post = await this.postRepository.getPostById(postId);
            if (!post) {
                throw new AppError('Post not found', 404);
            }

            const like = new Like(uuidv4(), postId, userId, new Date());
            await this.likeRepository.saveLike(like);

            post.likeCount++;
            await this.postRepository.updatePost(post);

            await this.cache.clear(); // Invalidate feed cache
            return post.likeCount;
        } finally {
            release();
        }
    }

    async unlikePost(postId: string, userId: string): Promise<number> {
        const lock = this.postRepository.getLock(postId);
        const release = await lock.acquire();
        try {
            const removed = await this.likeRepository.removeLike(postId, userId);
            if (!removed) {
                throw new AppError('Like not found', 404);
            }

            const post = await this.postRepository.getPostById(postId);
            if (post) {
                post.likeCount = Math.max(0, post.likeCount - 1);
                await this.postRepository.updatePost(post);
                await this.cache.clear(); // Invalidate feed cache
                return post.likeCount;
            }
            return 0;
        } finally {
            release();
        }
    }
}
