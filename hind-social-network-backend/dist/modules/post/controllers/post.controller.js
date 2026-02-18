"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostController = void 0;
const post_dto_1 = require("../dtos/post.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const app_error_1 = require("../../../shared/utils/app-error");
class PostController {
    constructor(postService) {
        this.postService = postService;
        this.createPost = async (req, res, next) => {
            try {
                const dto = (0, class_transformer_1.plainToClass)(post_dto_1.CreatePostDto, req.body);
                const errors = await (0, class_validator_1.validate)(dto);
                if (errors.length > 0) {
                    throw new app_error_1.AppError('Validation failed: ' + errors.toString(), 400);
                }
                const post = await this.postService.createPost(dto);
                res.status(201).json({
                    success: true,
                    message: 'Post created successfully',
                    data: post,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getFeed = async (req, res, next) => {
            try {
                const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                const cursor = req.query.cursor;
                const requestingUserId = req.query.userId;
                const searchQuery = req.query.search;
                const result = await this.postService.getFeed(limit, cursor, requestingUserId, searchQuery);
                res.status(200).json({
                    success: true,
                    message: 'Feed fetched successfully',
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getPost = async (req, res, next) => {
            try {
                const postId = req.params.postId;
                const requestingUserId = req.query.userId;
                const post = await this.postService.getPostById(postId, requestingUserId);
                res.status(200).json({
                    success: true,
                    message: 'Post fetched successfully',
                    data: post,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.sharePost = async (req, res, next) => {
            try {
                const postId = req.params.postId;
                const { userId } = req.body;
                if (!userId)
                    throw new app_error_1.AppError('userId required', 400);
                const shareCount = await this.postService.sharePost(postId, userId);
                res.status(200).json({
                    success: true,
                    message: 'Post shared',
                    data: { shareCount }
                });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.PostController = PostController;
