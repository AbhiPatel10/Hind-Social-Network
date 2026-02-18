"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
class Comment {
    constructor(commentId, postId, userId, content, createdAt) {
        this.commentId = commentId;
        this.postId = postId;
        this.userId = userId;
        this.content = content;
        this.createdAt = createdAt;
    }
}
exports.Comment = Comment;
