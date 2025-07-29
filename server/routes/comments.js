// commentRoutes.js
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/posts/:postId/comments", commentController.getComments);
router.post("/comments", authMiddleware, commentController.initNotificationService, commentController.createComment);
router.delete("/comments/:id", authMiddleware, commentController.deleteComment);
router.put("/comments/:id", authMiddleware, commentController.updateComment);
router.post("/comments/:id/like", authMiddleware, commentController.initNotificationService, commentController.likeComment);
router.post("/comments/:id/dislike", authMiddleware, commentController.dislikeComment);

module.exports = router;
