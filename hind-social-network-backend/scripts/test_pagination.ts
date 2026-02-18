
const API_URL = 'http://localhost:8080';

async function testPagination() {
    console.log('Testing Pagination...');
    let cursor: string | undefined = undefined;
    let allPosts: any[] = [];
    let pageCount = 0;
    const limit = 10;

    try {
        while (true) {
            pageCount++;
            console.log(`Fetching page ${pageCount} with cursor: ${cursor || 'start'}`);

            const params = new URLSearchParams({
                limit: limit.toString(),
                userId: 'user-1'
            });
            if (cursor) params.append('cursor', cursor);

            const response = await fetch(`${API_URL}/posts/feed?${params.toString()}`);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
            }

            const json = await response.json() as any;
            const data = json.data;
            const posts: any[] = data.posts;
            const nextCursor: string | undefined = data.nextCursor;

            console.log(`  Received ${posts.length} posts.`);

            if (posts.length > 0) {
                // Check for duplicates within this page
                const pageIds = new Set(posts.map((p: any) => p.id));
                if (pageIds.size !== posts.length) {
                    console.error('  ERROR: Duplicate posts found in single page!');
                }

                // Check for overlap with previous pages
                for (const post of posts) {
                    if (allPosts.some(p => p.id === post.id)) {
                        console.error(`  ERROR: Post ${post.id} appeared in previous pages!`);
                    }
                }

                // Check order (should be descending by createdAt)
                for (let i = 0; i < posts.length - 1; i++) {
                    const current = new Date(posts[i].createdAt).getTime();
                    const next = new Date(posts[i + 1].createdAt).getTime();
                    if (current < next) {
                        console.error(`  ERROR: Sort order violation at index ${i}! ${posts[i].createdAt} < ${posts[i + 1].createdAt}`);
                    }
                }

                // Check if first post of this page is older or equal to last post of previous page
                if (allPosts.length > 0) {
                    const lastPostOfPrev = allPosts[allPosts.length - 1];
                    const firstPostOfCurr = posts[0];
                    const lastTime = new Date(lastPostOfPrev.createdAt).getTime();
                    const currTime = new Date(firstPostOfCurr.createdAt).getTime();

                    if (currTime > lastTime) {
                        console.error(`  ERROR: Order violation between pages! Page ${pageCount} starts with newer post than Page ${pageCount - 1} ended with.`);
                    }
                }

                allPosts = [...allPosts, ...posts];
            }

            cursor = nextCursor;

            if (!cursor) {
                console.log('Reached end of feed (no nextCursor).');
                break;
            }

            // Safety break
            if (pageCount > 20) {
                console.log('Stopping after 20 pages.');
                break;
            }
        }

        console.log(`Total posts fetched: ${allPosts.length}`);

    } catch (e: any) {
        console.error('Error fetching feed:', e.message);
    }
}

testPagination();
