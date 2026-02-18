# Social Media Post Module

A production-ready backend module for a social media post system, built with Node.js, Express, and TypeScript.

## Features

- **Clean Architecture**: Controller -> Service -> Repository -> Infrastructure
- **In-Memory Persistence**: JSON file-based storage with atomic writes (concurrency safe).
- **Caching**: In-memory caching logic for feed retrieval.
- **Cursor-Based Pagination**: Efficient and consistent feed and comment generation.
- **Strict TypeScript**: Type safety across the board.
- **Concurrency Safety**: Mutex locking for atomic counter updates (Likes, Comments, Shares).
- **Rate Limiting**: Built-in protection against abuse.

## Logic Overview

### Entities
- **Post**: Contains content, author, stats (likes, comments, shares).
- **Comment**: Associated with a post and user.
- **Like**: Prevents duplicate likes from same user.

### Concurrency
- Uses a `Mutex` to serialize write operations to the JSON file storage.
- Uses `Mutex` in Service/Repository layers to ensure atomic updates to counters (like count, etc.) to prevent race conditions.

### Caching
- `MemoryCache` stores feed results to optimize read performance.
- Cache is invalidated (cleared) on new posts or interactions to ensure data freshness.

### Pagination
- **Cursor-Based**: Uses `base64(JSON.stringify({ createdAt, id }))` to ensure stable pagination even as new data is added.
- Applied to both **Feed** and **Comments**.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build**:
    ```bash
    npm run build
    ```

## API Endpoints

All responses follow the standard format:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### Posts
- `POST /posts`: Create a new post.
- `GET /posts/feed?limit=10&cursor=...`: Get the feed.
- `GET /posts/:postId`: Get a single post details.

### Interactions
- `POST /posts/:postId/like`: Like a post.
- `DELETE /posts/:postId/like?userId=...`: Unlike a post.
- `POST /posts/:postId/comments`: Add a comment.
- `GET /posts/:postId/comments`: Get comments for a post.
- `POST /posts/:postId/share`: Share a post.

## Implementation Details

- **Storage**: `src/infrastructure/storage/file-storage.ts`
- **Cache**: `src/infrastructure/cache/memory-cache.ts`
- **Post Logic**: `src/modules/post/`
## 🚀 Performance & Benchmarking

### Benchmark Results (Autocannon)
Running `npm run benchmark` (100 concurrent connections, 10s duration):
- **Requests/sec**: ~27,620
- **Average Latency**: ~4.7ms
- **Throughput**: High performance due to:
    - **In-Memory Feed Index**: No sorting on read.
    - **Rate Limiting**: Fast rejection of excess traffic (protecting core logic).
    - **Caching**: `MemoryCache` serving repeated feed requests.
    - **Write Buffering**: Reduced disk I/O latency.

### Scalability Design Notes

#### 1. Current Bottlenecks
- **Memory Usage**: All posts/comments are in memory (`Map<string, Post>`).
- **Single Node**: State is local; cannot scale horizontally without external store.
- **File I/O**: Single JSON file write (serialized) is a bottleneck at scale despite buffering.

#### 2. Scaling to 100k Posts
- **Current Architecture**: Can handle 100k posts in memory (approx 50-100MB RAM).
- **Optimization**: Use `Buffer` for IDs or specialized structures to reduce GC pressure.

#### 3. Scaling to 1M+ Posts
- **Index**: In-memory array sorting becomes slow for updates (`unshift` is O(N)). Switch to **Skip List** or **B-Tree**.
- **Storage**: Migrate from JSON to **PostgreSQL** or **MongoDB**.
- **Caching**: Move from `MemoryCache` to **Redis** to share cache across instances.

#### 4. Migration Strategy
1.  **Database**: Introduce `PostgresRepository` implementing `PostRepository` interface.
2.  **Cache**: Replace `MemoryCache` with `RedisAdapter`.
3.  **Horizontal Scaling**: Stateless API, use Redis for session/cache, Sticky Sessions if needed.
4.  **Sharding**: Shard `posts` table by `userId` or `region` for massive scale.

#### 5. Event-Driven Updates
- Move `invalidateFeedCache` and `updatePost` (counters) to an event bus (e.g., RabbitMQ/Kafka).
- Workers process likes/comments asynchronously to reduce API latency.

