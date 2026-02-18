# Design Documentation

## 1. Architecture

The project follows a **Clean Architecture** inspired structure, separating concerns into distinct layers:

-   **Controller Layer** (`src/modules/post/controllers`): Handles HTTP requests, validation (DTOs), and response formatting. It delegates business logic to the Service layer.
-   **Service Layer** (`src/modules/post/services`): Contains the core business logic. It orchestrates operations between the Repository, Cache, and other utilities. It is agnostic of the underlying storage or transport mechanisms.
-   **Repository Layer** (`src/modules/post/repositories`): Handles data access. In this project, it implements an **In-Memory Store** backed by a file system (JSON files) for persistence. It manages the in-memory data structures (`Map`, `Array`) and ensures data consistency.
-   **Infrastructure Layer** (`src/infrastructure`): Contains technical concerns like caching implementations (`MemoryCache`) and storage adapters (`FileStorage`).

### Data Flow
`Request -> Controller -> Service -> (Cache check) -> Repository -> (Disk I/O) -> Response`

## 2. Caching Strategy

To improve feed retrieval performance, a **Read-Through** caching strategy with **Write-Invalidation** is implemented.

-   **Cache Implementation**: A custom `MemoryCache` class (`src/infrastructure/cache/memory-cache.ts`) provides a Redis-like `get`/`set` API with Time-To-Live (TTL) support.
-   **Feed Caching**: The `getFeed` method in `PostService` caches the result of feed queries. The cache key includes the `limit`, `cursor`, and `requestingUserId` to ensure uniqueness.
    -   Key Format: `feed:{limit}:{cursor}:{userId}`
    -   TTL: 60 seconds (default).
-   **Invalidation**: To ensure data consistency, the entire feed cache is cleared (`invalidateFeedCache`) whenever a state change occurs that affects the feed:
    -   New Post created
    -   Post Liked/Unliked
    -   Comment added
    -   Post Shared
-   **Trade-off**: Clearing the entire cache is simple and guarantees consistency but can be inefficient at scale. A production system would use more granular invalidation or a push-model.

## 3. Pagination Strategy

The system uses **Cursor-Based Pagination** to ensure stable and efficient data retrieval.

-   **Problem with Offset**: Traditional `offset/limit` pagination is unstable (skips/duplicates) when new items are added to the list while a user is scrolling.
-   **Cursor Approach**:
    -   The cursor is a **Base64 encoded string** containing the `createdAt` timestamp and the unique `postId` of the last item in the current page.
    -   Example Cursor Data: `{ "createdAt": "2024-02-20T12:00:00Z", "postId": "uuid-..." }`
-   **Retrieval Logic**:
    -   The Repository maintains a sorted `feedIndex` (descending by time).
    -   When a cursor is provided, the repository searches for the item immediately following the cursor's timestamp/ID.
    -   This guarantees that even if new posts are added to the top of the feed, the user's relative position remains correct.

## 4. Concurrency & Consistency

Given the in-memory nature combined with file persistence, concurrency control is critical to prevent race conditions (e.g., two users liking a post simultaneously resulting in an incorrect count, or file corruption).

-   **Mutex Locking**: The project uses `async-mutex` to handle concurrency.
    -   **Global Lock**: A mutex ensures that writes to the JSON file (`flush`) do not overlap.
    -   **Granular Locks**: The Repository maintains a map of locks *per post* (`getLock(postId)`).
-   **Engagement Atomic Updates**:
    -   When a user interacts (Like/Comment/Share), the Service acquires a lock for that specific `postId`.
    -   This ensures that the "Read -> Modify -> Write" cycle on the Post object is atomic.
-   **Persistence**:
    -   Updates are applied immediately to the In-Memory state (`Map`).
    -   A `writeBuffer` flag marks data as dirty.
    -   A background flush loop (every 5 seconds) writes the dirty in-memory state to `posts.json` atomically.

## 5. Storage Model

-   **In-Memory**:
    -   `posts`: `Map<postId, Post>` for O(1) lookups.
    -   `feedIndex`: `Array<Post>` sorted by `createdAt` for O(log n) or O(1) feed generation.
    -   `likes`: `Map<postId, Set<userId>>` for O(1) duplicate checks.
    -   `comments`: `Map<postId, Comment[]>` for fast comment retrieval.
-   **Disk**:
    -   `posts.json`: Array of Post objects.
    -   `likes.json`: Array of Like objects (flattened).
    -   `comments.json`: Array of Comment objects.
