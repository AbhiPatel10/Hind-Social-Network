export interface User {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
}

export interface Post {
    id: string;
    userId: string;
    user: User;
    content: string;
    mediaUrls?: string[];
    likeCount: number;
    commentCount: number;
    shareCount: number;
    createdAt: string;
    hasLiked?: boolean;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    user: User;
    content: string;
    createdAt: string;
}
