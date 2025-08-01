const express = require("express");
const router = express.Router();
const scheduleCommentController = require("../controllers/scheduleCommentController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // 파일명 중복 방지
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // 이미지 파일만 허용
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("이미지 파일만 업로드 가능합니다."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
});

// 일정별 댓글 목록 (로그인 선택사항)
router.get("/:scheduleId/comments", scheduleCommentController.list);

// 댓글 등록 (로그인 필요, 파일 업로드 선택)
router.post(
  "/:scheduleId/comments",
  auth,
  upload.single("file"),
  scheduleCommentController.create
);

// 댓글 수정 (작성자만 가능)
router.put("/:scheduleId/comments/:commentId", auth, scheduleCommentController.update);

// 댓글 삭제 (작성자만 가능)
router.delete(
  "/:scheduleId/comments/:commentId",
  auth,
  scheduleCommentController.remove
);

// 댓글 좋아요
router.post(
  "/:scheduleId/comments/:commentId/like",
  auth,
  scheduleCommentController.like
);

// 댓글 싫어요
router.post(
  "/:scheduleId/comments/:commentId/dislike",
  auth,
  scheduleCommentController.dislike
);

// 에러 핸들링 미들웨어
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "파일 크기는 5MB 이하여야 입니다." });
    }
    return res.status(400).json({ error: "파일 업로드 오류가 발생했습니다." });
  }
  if (error.message === "이미지 파일만 업로드 가능합니다.") {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

module.exports = router;