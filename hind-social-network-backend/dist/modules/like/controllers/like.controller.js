"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeController = void 0;
const app_error_1 = require("../../../shared/utils/app-error");
class LikeController {
    constructor(likeService) {
        this.likeService = likeService;
        this.likePost = async (req, res, next) => {
            try {
                const postId = req.params.postId;
                const { userId } = req.body;
                if (!userId)
                    throw new app_error_1.AppError('userId required', 400);
                const likeCount = await this.likeService.likePost(postId, userId);
                res.status(200).json({
                    success: true,
                    message: 'Post liked',
                    data: { likeCount },
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.unlikePost = async (req, res, next) => {
            try {
                const postId = req.params.postId;
                const userId = req.query.userId;
                if (!userId)
                    throw new app_error_1.AppError('userId required', 400);
                const likeCount = await this.likeService.unlikePost(postId, userId);
                res.status(200).json({
                    success: true,
                    message: 'Post unliked',
                    data: { likeCount }
                });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.LikeController = LikeController;
