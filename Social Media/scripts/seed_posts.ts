
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const POSTS_FILE = path.join(__dirname, '../../data/posts.json');

interface Post {
    postId: string;
    userId: string;
    content: string;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    likeCount: number;
    commentCount: number;
    shareCount: number;
    mediaUrls: string[];
}

const USERS = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'Abhi', 'Jane'];

function generatePosts(count: number): Post[] {
    const posts: Post[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        // Generate dates in descending order (newest first) but with some randomness
        // to simulate real usage where insertion might not be perfectly ordered by time if we were appending
        // but here we generate them.
        // Let's generate them slightly out of order and then sort them, or just random times.
        // To test robustly, let's generate random times within the last 30 days.

        const timeOffset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
        const createdAt = new Date(now.getTime() - timeOffset);

        posts.push({
            postId: uuidv4(),
            userId: USERS[Math.floor(Math.random() * USERS.length)],
            content: `Generated post ${i + 1} - ${Math.random().toString(36).substring(7)}`,
            createdAt: createdAt.toISOString(),
            updatedAt: createdAt.toISOString(),
            likeCount: Math.floor(Math.random() * 100),
            commentCount: Math.floor(Math.random() * 20),
            shareCount: Math.floor(Math.random() * 10),
            mediaUrls: []
        });
    }
    return posts;
}

function seed() {
    console.log('Seeding posts...');
    let existingPosts: Post[] = [];

    if (fs.existsSync(POSTS_FILE)) {
        const data = fs.readFileSync(POSTS_FILE, 'utf-8');
        existingPosts = JSON.parse(data);
    }

    // Generate 70 more posts to reach ~100
    const newPosts = generatePosts(70);
    const allPosts = [...existingPosts, ...newPosts];

    // Sort by createdAt descending (just to be nice, though repository should handle it)
    // The repository sorts on load, so strictly speaking this isn't necessary for correctness,
    // but good for inspection.
    allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    fs.writeFileSync(POSTS_FILE, JSON.stringify(allPosts, null, 2));
    console.log(`Seeded ${newPosts.length} new posts. Total: ${allPosts.length}`);
}

seed();
