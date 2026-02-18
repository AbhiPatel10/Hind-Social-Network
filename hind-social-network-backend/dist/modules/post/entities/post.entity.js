"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
class Post {
    constructor(postId, userId, content, createdAt, updatedAt, likeCount = 0, commentCount = 0, shareCount = 0, mediaUrls = []) {
        this.postId = postId;
        this.userId = userId;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.likeCount = likeCount;
        this.commentCount = commentCount;
        this.shareCount = shareCount;
        this.mediaUrls = mediaUrls;
    }
}
exports.Post = Post;
