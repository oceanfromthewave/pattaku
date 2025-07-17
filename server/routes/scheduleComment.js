const express = require("express");
const router = express.Router();
const scheduleCommentController = require("../controllers/scheduleCommentController");
const auth = require("../middleware/authMiddleware");

// 일정별 댓글 목록
router.get("/:id/comments", scheduleCommentController.list);

// 댓글 등록 (로그인 필요)
router.post("/:id/comments", auth, scheduleCommentController.create);

// 댓글 삭제 (작성자만 가능, 선택)
router.delete("/comments/:commentId", auth, scheduleCommentController.remove);

module.exports = router;
