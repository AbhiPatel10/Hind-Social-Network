import { Router } from 'express';
import { PostController } from './controllers/post.controller';
import { PostService } from './services/post.service';
import { PostRepository } from './repositories/post.repository';
import { FileStorage } from '../../infrastructure/storage/file-storage';
import { MemoryCache } from '../../infrastructure/cache/memory-cache';

// Dependency Injection Setup
// In a real app, use a DI container like InversifyJS or NestJS
const storage = new FileStorage();
const repository = new PostRepository(storage);
const cache = new MemoryCache();
const service = new PostService(repository, cache);
const controller = new PostController(service);

const router = Router();

router.post('/', controller.createPost);
router.get('/feed', controller.getFeed);
router.get('/:postId', controller.getPost);
router.post('/:postId/like', controller.likePost);
router.delete('/:postId/like', controller.unlikePost);
router.post('/:postId/comments', controller.commentPost);
router.get('/:postId/comments', controller.getComments);
router.post('/:postId/share', controller.sharePost);

export default router;
