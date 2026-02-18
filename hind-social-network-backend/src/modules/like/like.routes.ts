import { Router } from 'express';
import { LikeController } from './controllers/like.controller';
import { LikeService } from './services/like.service';
import { postRepository, likeRepository, memoryCache } from '../../shared/container';

const service = new LikeService(likeRepository, postRepository, memoryCache);
const controller = new LikeController(service);

const router = Router({ mergeParams: true });

router.post('/', controller.likePost);
router.delete('/', controller.unlikePost);

export default router;
