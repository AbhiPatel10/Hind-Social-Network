import { FileStorage } from '../infrastructure/storage/file-storage';
import { MemoryCache } from '../infrastructure/cache/memory-cache';
import { PostRepository } from '../modules/post/repositories/post.repository';
import { CommentRepository } from '../modules/comment/repositories/comment.repository';
import { LikeRepository } from '../modules/like/repositories/like.repository';

// Infrastructure
export const fileStorage = new FileStorage();
export const memoryCache = new MemoryCache();

// Repositories
export const postRepository = new PostRepository(fileStorage);
export const commentRepository = new CommentRepository(fileStorage);
export const likeRepository = new LikeRepository(fileStorage);
