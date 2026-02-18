import { v4 as uuidv4 } from 'uuid';
import { CommentRepository } from '../repositories/comment.repository';
import { PostRepository } from '../../post/repositories/post.repository';
import { CacheAdapter } from '../../../infrastructure/cache/memory-cache';
import { CreateCommentDto } from '../dtos/comment.dto';
import { Comment } from '../entities/comment.entity';
import { AppError } from '../../../shared/utils/app-error';
import { User } from '../../../shared/interfaces/user.interface';

export class CommentService {
    constructor(
        private commentRepository: CommentRepository,
        private postRepository: PostRepository,
        private cache: CacheAdapter
    ) { }

    private getUser(userId: string): User {
        // Mock User Data - In real app, this would come from UserRepository
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

    async addComment(postId: string, dto: CreateCommentDto): Promise<Comment & { user: User; id: string }> {
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

            await this.commentRepository.saveComment(comment);

            post.commentCount++;
            await this.postRepository.updatePost(post);
            await this.cache.clear(); // Invalidate feed cache

            return { ...comment, id: comment.commentId, user: this.getUser(comment.userId) };
        } finally {
            release();
        }
    }

    async getComments(postId: string, limit: number = 10, cursor?: string): Promise<{ comments: (Comment & { user: User; id: string })[]; nextCursor: string | null }> {
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

        const comments = await this.commentRepository.getComments(postId, limit, decodedCursor);
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
}
