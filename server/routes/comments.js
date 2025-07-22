// commentRoutes.js
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/posts/:postId/comments", commentController.getComments);
router.post("/comments", authMiddleware, commentController.createComment);
router.delete("/comments/:id", authMiddleware, commentController.deleteComment);
router.put("/comments/:id", authMiddleware, commentController.updateComment);

module.exports = router;
