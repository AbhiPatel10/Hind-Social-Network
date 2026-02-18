import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
import { CreateCommentDto } from '../dtos/comment.dto';
import { AppError } from '../../../shared/utils/app-error';

export class CommentController {
    constructor(private commentService: CommentService) { }

    createComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postId = req.params.postId as string;
            const dto = req.body as CreateCommentDto;

            const comment = await this.commentService.addComment(postId, dto);
            res.status(201).json({
                success: true,
                message: 'Comment added',
                data: comment
            });
        } catch (error) {
            next(error);
        }
    };

    getComments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postId = req.params.postId as string;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const cursor = req.query.cursor as string | undefined;

            const result = await this.commentService.getComments(postId, limit, cursor);
            res.status(200).json({
                success: true,
                message: 'Comments fetched successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    };
}
