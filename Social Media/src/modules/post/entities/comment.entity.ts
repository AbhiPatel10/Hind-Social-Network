export class Comment {
    constructor(
        public commentId: string,
        public postId: string,
        public userId: string,
        public content: string,
        public createdAt: Date
    ) { }
}
