import { Request, Response, NextFunction } from 'express';
import { LikeService } from '../services/like.service';
import { AppError } from '../../../shared/utils/app-error';

export class LikeController {
    constructor(private likeService: LikeService) { }

    likePost = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postId = req.params.postId as string;
            const { userId } = req.body; // Middleware ensures checks based on DTO

            const likeCount = await this.likeService.likePost(postId, userId);
            res.status(200).json({
                success: true,
                message: 'Post liked',
                data: { likeCount },
            });
        } catch (error) {
            next(error);
        }
    };

    unlikePost = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postId = req.params.postId as string;
            const userId = req.query.userId as string;

            if (!userId) throw new AppError('userId required', 400);

            const likeCount = await this.likeService.unlikePost(postId, userId);
            res.status(200).json({
                success: true,
                message: 'Post unliked',
                data: { likeCount }
            });
        } catch (error) {
            next(error);
        }
    };
}
