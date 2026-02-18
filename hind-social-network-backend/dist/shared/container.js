"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeRepository = exports.commentRepository = exports.postRepository = exports.memoryCache = exports.fileStorage = void 0;
const file_storage_1 = require("../infrastructure/storage/file-storage");
const memory_cache_1 = require("../infrastructure/cache/memory-cache");
const post_repository_1 = require("../modules/post/repositories/post.repository");
const comment_repository_1 = require("../modules/comment/repositories/comment.repository");
const like_repository_1 = require("../modules/like/repositories/like.repository");
// Infrastructure
exports.fileStorage = new file_storage_1.FileStorage();
exports.memoryCache = new memory_cache_1.MemoryCache();
// Repositories
exports.postRepository = new post_repository_1.PostRepository(exports.fileStorage);
exports.commentRepository = new comment_repository_1.CommentRepository(exports.fileStorage);
exports.likeRepository = new like_repository_1.LikeRepository(exports.fileStorage);
