export class Post {
    constructor(
        public postId: string,
        public userId: string,
        public content: string,
        public createdAt: Date,
        public updatedAt: Date,
        public likeCount: number = 0,
        public commentCount: number = 0,
        public shareCount: number = 0,
        public mediaUrls: string[] = []
    ) { }
}
