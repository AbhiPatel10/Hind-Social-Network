"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comment_controller_1 = require("./controllers/comment.controller");
const comment_service_1 = require("./services/comment.service");
const container_1 = require("../../shared/container");
const service = new comment_service_1.CommentService(container_1.commentRepository, container_1.postRepository, container_1.memoryCache);
const controller = new comment_controller_1.CommentController(service);
const router = (0, express_1.Router)({ mergeParams: true }); // mergeParams to access postId from parent router
router.post('/', controller.createComment);
router.get('/', controller.getComments);
exports.default = router;
