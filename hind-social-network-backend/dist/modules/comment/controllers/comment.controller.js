"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentController = void 0;
const comment_dto_1 = require("../dtos/comment.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const app_error_1 = require("../../../shared/utils/app-error");
class CommentController {
    constructor(commentService) {
        this.commentService = commentService;
        this.createComment = async (req, res, next) => {
            try {
                const postId = req.params.postId;
                const dto = (0, class_transformer_1.plainToClass)(comment_dto_1.CreateCommentDto, req.body);
                const errors = await (0, class_validator_1.validate)(dto);
                if (errors.length > 0)
                    throw new app_error_1.AppError('Validation failed: ' + errors.toString(), 400);
                const comment = await this.commentService.addComment(postId, dto);
                res.status(201).json({
                    success: true,
                    message: 'Comment added',
                    data: comment
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getComments = async (req, res, next) => {
            try {
                const postId = req.params.postId;
                const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                const cursor = req.query.cursor;
                const result = await this.commentService.getComments(postId, limit, cursor);
                res.status(200).json({
                    success: true,
                    message: 'Comments fetched successfully',
                    data: result
                });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.CommentController = CommentController;
