"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const mutex_1 = require("../../../shared/utils/mutex");
const metrics_service_1 = require("../../../shared/services/metrics.service");
class PostRepository {
    constructor(storage) {
        this.storage = storage;
        this.postsFile = 'posts.json';
        // In-Memory State
        this.posts = new Map();
        // Feed Index (Sorted)
        this.feedIndex = [];
        // Write Buffer
        this.writeBuffer = false;
        // Per-Post Locks
        this.locks = new Map();
        this.initialize();
        this.flushInterval = setInterval(() => this.flush(), 5000); // Flush every 5 seconds
        // Graceful Shutdown
        process.on('SIGINT', async () => {
            await this.flush();
            process.exit(0);
        });
    }
    async initialize() {
        const posts = await this.storage.read(this.postsFile) || [];
        // Hydrate Posts
        posts.forEach(p => {
            const post = { ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) };
            this.posts.set(p.postId, post);
            this.feedIndex.push(post);
        });
        this.sortFeedIndex();
        console.log(`[Repository] Initialized with ${this.posts.size} posts.`);
    }
    sortFeedIndex() {
        this.feedIndex.sort((a, b) => {
            const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
            if (timeDiff !== 0)
                return timeDiff;
            return b.postId.localeCompare(a.postId);
        });
    }
    async flush() {
        if (this.writeBuffer) {
            await this.storage.write(this.postsFile, Array.from(this.posts.values()));
            this.writeBuffer = false;
            metrics_service_1.MetricsService.getInstance().recordDiskWrite();
        }
    }
    // --- Locking ---
    getLock(postId) {
        if (!this.locks.has(postId)) {
            this.locks.set(postId, new mutex_1.Mutex());
        }
        return this.locks.get(postId);
    }
    // --- Posts ---
    async savePost(post) {
        this.posts.set(post.postId, post);
        // Insert into Sorted Index efficiently (Binary Search in real app, unshift for simplicity if mostly new)
        // Since new posts are usually newest, unshift is O(1) mostly, but just re-sorting is safe for now or manual insert.
        // Given 'createdAt' is newest, unshift is best.
        this.feedIndex.unshift(post);
        this.writeBuffer = true;
    }
    async getPosts(limit, cursor, searchQuery) {
        let posts = this.feedIndex;
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            posts = posts.filter(p => p.content.toLowerCase().includes(lowerQuery));
        }
        if (!cursor) {
            return posts.slice(0, limit);
        }
        const cursorTime = cursor.createdAt.getTime();
        // Use filtered posts list for pagination
        const startIndex = posts.findIndex(p => {
            const pTime = p.createdAt.getTime();
            return pTime < cursorTime || (pTime === cursorTime && p.postId < cursor.postId);
        });
        if (startIndex === -1)
            return [];
        return posts.slice(startIndex, startIndex + limit);
    }
    async getPostById(postId) {
        return this.posts.get(postId);
    }
    async updatePost(updatedPost) {
        this.posts.set(updatedPost.postId, updatedPost);
        // Update index reference if needed (objects are by ref, so usually fine unless replaced)
        const idx = this.feedIndex.findIndex(p => p.postId === updatedPost.postId);
        if (idx !== -1) {
            this.feedIndex[idx] = updatedPost;
        }
        this.writeBuffer = true;
    }
}
exports.PostRepository = PostRepository;
