import { Router } from 'express';
import { PostController } from './controllers/post.controller';
import { PostService } from './services/post.service';
import { postRepository, likeRepository, memoryCache } from '../../shared/container';

const service = new PostService(postRepository, likeRepository, memoryCache);
const controller = new PostController(service);

const router = Router();

router.post('/', controller.createPost);
router.get('/feed', controller.getFeed);
router.get('/:postId', controller.getPost);
router.post('/:postId/share', controller.sharePost);

export default router;
