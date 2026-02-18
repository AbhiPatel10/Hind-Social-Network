import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/post.service';
import { CreatePostDto } from '../dtos/post.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AppError } from '../../../shared/utils/app-error';

export class PostController {
    constructor(private postService: PostService) { }

    createPost = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = plainToClass(CreatePostDto, req.body);
            const errors = await validate(dto);
            if (errors.length > 0) {
                throw new AppError('Validation failed: ' + errors.toString(), 400);
            }

            const post = await this.postService.createPost(dto);
            res.status(201).json({
                success: true,
                message: 'Post created successfully',
                data: post,
            });
        } catch (error) {
            next(error);
        }
    };

    getFeed = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const cursor = req.query.cursor as string | undefined;
            const requestingUserId = req.query.userId as string | undefined;
            const searchQuery = req.query.search as string | undefined;

            const result = await this.postService.getFeed(limit, cursor, requestingUserId, searchQuery);
            res.status(200).json({
                success: true,
                message: 'Feed fetched successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    getPost = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postId = req.params.postId as string;
            const requestingUserId = req.query.userId as string | undefined;
            const post = await this.postService.getPostById(postId, requestingUserId);
            res.status(200).json({
                success: true,
                message: 'Post fetched successfully',
                data: post,
            });
        } catch (error) {
            next(error);
        }
    };



    sharePost = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postId = req.params.postId as string;
            const { userId } = req.body;
            if (!userId) throw new AppError('userId required', 400);

            const shareCount = await this.postService.sharePost(postId, userId);
            res.status(200).json({
                success: true,
                message: 'Post shared',
                data: { shareCount }
            });
        } catch (error) {
            next(error);
        }
    }
}
