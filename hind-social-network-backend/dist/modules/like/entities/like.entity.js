"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Like = void 0;
class Like {
    constructor(likeId, postId, userId, createdAt) {
        this.likeId = likeId;
        this.postId = postId;
        this.userId = userId;
        this.createdAt = createdAt;
    }
}
exports.Like = Like;
