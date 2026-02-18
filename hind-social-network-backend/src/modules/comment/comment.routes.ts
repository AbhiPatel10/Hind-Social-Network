import { Router } from 'express';
import { CommentController } from './controllers/comment.controller';
import { CommentService } from './services/comment.service';
import { postRepository, commentRepository, memoryCache } from '../../shared/container';

const service = new CommentService(commentRepository, postRepository, memoryCache);
const controller = new CommentController(service);

import { CreateCommentDto } from './dtos/comment.dto';
import { validationMiddleware } from '../../shared/middlewares/validation.middleware';

const router = Router({ mergeParams: true }); // mergeParams to access postId from parent router

router.post('/', validationMiddleware(CreateCommentDto), controller.createComment);
router.get('/', controller.getComments);

export default router;
