export class Like {
    constructor(
        public likeId: string,
        public postId: string,
        public userId: string,
        public createdAt: Date
    ) { }
}
