import { Like } from '../entities/like.entity';
import { StorageAdapter } from '../../../infrastructure/storage/file-storage';
import { MetricsService } from '../../../shared/services/metrics.service';

export class LikeRepository {
    private likesFile = 'likes.json';
    private likes: Map<string, Set<string>> = new Map(); // postId -> Set<userId>
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
        const likes = await this.storage.read<Like[]>(this.likesFile) || [];
        likes.forEach(l => {
            if (!this.likes.has(l.postId)) this.likes.set(l.postId, new Set());
            this.likes.get(l.postId)?.add(l.userId);
        });
    }

    private async flush() {
        if (this.writeBuffer) {
            const allLikes: Like[] = [];
            this.likes.forEach((userIds, postId) => {
                userIds.forEach(userId => {
                    allLikes.push({ likeId: 'generated-on-read', postId, userId, createdAt: new Date() });
                });
            });
            await this.storage.write(this.likesFile, allLikes);
            this.writeBuffer = false;
            MetricsService.getInstance().recordDiskWrite();
        }
    }

    async saveLike(like: Like): Promise<void> {
        if (!this.likes.has(like.postId)) {
            this.likes.set(like.postId, new Set());
        }
        this.likes.get(like.postId)?.add(like.userId);
        this.writeBuffer = true;
    }

    async removeLike(postId: string, userId: string): Promise<boolean> {
        if (this.likes.has(postId)) {
            const deleted = this.likes.get(postId)?.delete(userId);
            if (deleted) {
                this.writeBuffer = true;
                return true;
            }
        }
        return false;
    }

    async existsLike(postId: string, userId: string): Promise<boolean> {
        return this.likes.get(postId)?.has(userId) || false;
    }
}
