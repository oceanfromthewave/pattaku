const express = require("express");
const router = express.Router();
const scheduleCommentController = require("../controllers/scheduleCommentController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// 일정별 댓글 목록
router.get("/:id/comments", scheduleCommentController.list);

// 댓글 등록 (로그인 필요)
router.post(
  "/:id/comments",
  auth,
  upload.single("file"),
  scheduleCommentController.create
);

// 댓글 삭제 (작성자만 가능, 선택)
router.delete(
  "/:id/comments/:commentId",
  auth,
  scheduleCommentController.remove
);
module.exports = router;

router.post(
  "/:id/comments/:commentId/like",
  auth,
  scheduleCommentController.like
);
router.post(
  "/:id/comments/:commentId/dislike",
  auth,
  scheduleCommentController.dislike
);
