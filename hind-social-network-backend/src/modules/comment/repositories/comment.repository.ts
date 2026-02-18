import { Comment } from '../entities/comment.entity';
import { StorageAdapter } from '../../../infrastructure/storage/file-storage';
import { MetricsService } from '../../../shared/services/metrics.service';

export class CommentRepository {
    private commentsFile = 'comments.json';
    private comments: Map<string, Comment[]> = new Map(); // postId -> comments
    private writeBuffer = false;
    private flushInterval: NodeJS.Timeout;

    constructor(private storage: StorageAdapter) {
        this.initialize();
        this.flushInterval = setInterval(() => this.flush(), 5000);

        process.on('SIGINT', async () => {
            await this.flush();
            process.exit(0);
        });
    }

    private async initialize() {
        const comments = await this.storage.read<Comment[]>(this.commentsFile) || [];
        comments.forEach(c => {
            const comment = { ...c, createdAt: new Date(c.createdAt) };
            if (!this.comments.has(c.postId)) this.comments.set(c.postId, []);
            this.comments.get(c.postId)?.push(comment);
        });
    }

    private async flush() {
        if (this.writeBuffer) {
            const allComments = Array.from(this.comments.values()).flat();
            await this.storage.write(this.commentsFile, allComments);
            this.writeBuffer = false;
            MetricsService.getInstance().recordDiskWrite();
        }
    }

    async saveComment(comment: Comment): Promise<void> {
        if (!this.comments.has(comment.postId)) {
            this.comments.set(comment.postId, []);
        }
        const list = this.comments.get(comment.postId)!;
        list.unshift(comment); // Keep sorted by newest
        this.writeBuffer = true;
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
}
