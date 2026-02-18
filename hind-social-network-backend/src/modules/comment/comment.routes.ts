import { Router } from 'express';
import { CommentController } from './controllers/comment.controller';
import { CommentService } from './services/comment.service';
import { postRepository, commentRepository, memoryCache } from '../../shared/container';

const service = new CommentService(commentRepository, postRepository, memoryCache);
const controller = new CommentController(service);

const router = Router({ mergeParams: true }); // mergeParams to access postId from parent router

router.post('/', controller.createComment);
router.get('/', controller.getComments);

export default router;
