import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';
import { StorageAdapter } from '../../../infrastructure/storage/file-storage';
import { Mutex } from '../../../shared/utils/mutex';
import { MetricsService } from '../../../shared/services/metrics.service';

export class PostRepository {
    private postsFile = 'posts.json';
    private commentsFile = 'comments.json';
    private likesFile = 'likes.json';

    // In-Memory State
    private posts: Map<string, Post> = new Map();
    private comments: Map<string, Comment[]> = new Map(); // postId -> comments
    private likes: Map<string, Set<string>> = new Map(); // postId -> Set<userId>

    // Feed Index (Sorted)
    private feedIndex: Post[] = [];

    // Write Buffer
    private writeBuffer: { posts: boolean; comments: boolean; likes: boolean } = { posts: false, comments: false, likes: false };
    private flushInterval: NodeJS.Timeout;

    // Per-Post Locks
    private locks: Map<string, Mutex> = new Map();

    constructor(private storage: StorageAdapter) {
        this.initialize();
        this.flushInterval = setInterval(() => this.flush(), 5000); // Flush every 5 seconds

        // Graceful Shutdown
        process.on('SIGINT', async () => {
            await this.flush();
            process.exit(0);
        });
    }

    private async initialize() {
        const [posts, comments, likes] = await Promise.all([
            this.storage.read<Post[]>(this.postsFile) || [],
            this.storage.read<Comment[]>(this.commentsFile) || [],
            this.storage.read<Like[]>(this.likesFile) || []
        ]);

        // Hydrate Posts
        posts.forEach(p => {
            const post = { ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) };
            this.posts.set(p.postId, post);
            this.feedIndex.push(post);
        });
        this.sortFeedIndex();

        // Hydrate Comments
        comments.forEach(c => {
            const comment = { ...c, createdAt: new Date(c.createdAt) };
            if (!this.comments.has(c.postId)) this.comments.set(c.postId, []);
            this.comments.get(c.postId)?.push(comment);
        });

        // Hydrate Likes
        likes.forEach(l => {
            if (!this.likes.has(l.postId)) this.likes.set(l.postId, new Set());
            this.likes.get(l.postId)?.add(l.userId);
        });

        console.log(`[Repository] Initialized with ${this.posts.size} posts, ${comments.length} comments, ${likes.length} likes.`);
    }

    private sortFeedIndex() {
        this.feedIndex.sort((a, b) => {
            const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
            if (timeDiff !== 0) return timeDiff;
            return b.postId.localeCompare(a.postId);
        });
    }

    private async flush() {
        if (this.writeBuffer.posts) {
            await this.storage.write(this.postsFile, Array.from(this.posts.values()));
            this.writeBuffer.posts = false;
            MetricsService.getInstance().recordDiskWrite();
        }
        if (this.writeBuffer.comments) {
            const allComments = Array.from(this.comments.values()).flat();
            await this.storage.write(this.commentsFile, allComments);
            this.writeBuffer.comments = false;
            MetricsService.getInstance().recordDiskWrite();
        }
        if (this.writeBuffer.likes) {
            const allLikes: Like[] = [];
            this.likes.forEach((userIds, postId) => {
                userIds.forEach(userId => {
                    allLikes.push({ likeId: 'generated-on-read', postId, userId, createdAt: new Date() }); // Simplified reconstruction
                });
            });
            await this.storage.write(this.likesFile, allLikes);
            this.writeBuffer.likes = false;
            MetricsService.getInstance().recordDiskWrite();
        }
    }

    // --- Locking ---
    getLock(postId: string): Mutex {
        if (!this.locks.has(postId)) {
            this.locks.set(postId, new Mutex());
        }
        return this.locks.get(postId)!;
    }

    // --- Posts ---
    async savePost(post: Post): Promise<void> {
        this.posts.set(post.postId, post);

        // Insert into Sorted Index efficiently (Binary Search in real app, unshift for simplicity if mostly new)
        // Since new posts are usually newest, unshift is O(1) mostly, but just re-sorting is safe for now or manual insert.
        // Given 'createdAt' is newest, unshift is best.
        this.feedIndex.unshift(post);

        this.writeBuffer.posts = true;
    }

    async getPosts(limit: number, cursor?: { createdAt: Date, postId: string }): Promise<Post[]> {
        if (!cursor) {
            return this.feedIndex.slice(0, limit);
        }

        const cursorTime = cursor.createdAt.getTime();
        // Optimization: Since index is sorted, we can search.
        // Linear search is fine for 100k items in memory, but binary search better.
        // For simplicity of this step, linear search on in-memory array is much faster than FS read.
        const startIndex = this.feedIndex.findIndex(p => {
            const pTime = p.createdAt.getTime();
            return pTime < cursorTime || (pTime === cursorTime && p.postId < cursor.postId);
        });

        if (startIndex === -1) return [];
        return this.feedIndex.slice(startIndex, startIndex + limit);
    }

    async getPostById(postId: string): Promise<Post | undefined> {
        return this.posts.get(postId);
    }

    async updatePost(updatedPost: Post): Promise<void> {
        this.posts.set(updatedPost.postId, updatedPost);
        // Update index reference if needed (objects are by ref, so usually fine unless replaced)
        const idx = this.feedIndex.findIndex(p => p.postId === updatedPost.postId);
        if (idx !== -1) {
            this.feedIndex[idx] = updatedPost;
        }
        this.writeBuffer.posts = true;
    }

    // --- Comments ---
    async saveComment(comment: Comment): Promise<void> {
        if (!this.comments.has(comment.postId)) {
            this.comments.set(comment.postId, []);
        }
        const list = this.comments.get(comment.postId)!;
        list.unshift(comment); // Keep sorted by newest
        this.writeBuffer.comments = true;
    }

    async getComments(postId: string, limit: number, cursor?: { createdAt: Date, commentId: string }): Promise<Comment[]> {
        const postComments = this.comments.get(postId) || [];

        if (!cursor) {
            return postComments.slice(0, limit);
        }

        const cursorTime = cursor.createdAt.getTime();
        const startIndex = postComments.findIndex(c => {
            const cTime = c.createdAt.getTime();
            return cTime < cursorTime || (cTime === cursorTime && c.commentId < cursor.commentId);
        });

        if (startIndex === -1) return [];
        return postComments.slice(startIndex, startIndex + limit);
    }

    // --- Likes ---
    async saveLike(like: Like): Promise<void> {
        if (!this.likes.has(like.postId)) {
            this.likes.set(like.postId, new Set());
        }
        this.likes.get(like.postId)?.add(like.userId);
        this.writeBuffer.likes = true;
    }

    async removeLike(postId: string, userId: string): Promise<boolean> {
        if (this.likes.has(postId)) {
            const deleted = this.likes.get(postId)?.delete(userId);
            if (deleted) {
                this.writeBuffer.likes = true;
                return true;
            }
        }
        return false;
    }

    async existsLike(postId: string, userId: string): Promise<boolean> {
        return this.likes.get(postId)?.has(userId) || false;
    }
}
