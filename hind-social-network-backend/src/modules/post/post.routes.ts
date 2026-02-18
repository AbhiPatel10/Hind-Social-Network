import { Router } from 'express';
import { PostController } from './controllers/post.controller';
import { PostService } from './services/post.service';
import { postRepository, likeRepository, memoryCache } from '../../shared/container';
import { CreatePostDto } from './dtos/post.dto';
import { validationMiddleware } from '../../shared/middlewares/validation.middleware';

const service = new PostService(postRepository, likeRepository, memoryCache);
const controller = new PostController(service);

const router = Router();

router.post('/', validationMiddleware(CreatePostDto), controller.createPost);
router.get('/feed', controller.getFeed);
router.get('/:postId', controller.getPost);
router.post('/:postId/share', controller.sharePost);

export default router;
