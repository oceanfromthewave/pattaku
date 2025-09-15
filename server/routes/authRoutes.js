// authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

router.post("/login", authController.login);

// 토큰 검증 (클라이언트 부팅 시 세션 확인용)
router.get("/verify", auth, (req, res) => {
  res.json({
    userId: req.user.id,
    username: req.user.username,
    nickname: req.user.nickname,
  });
});

// 로그아웃 (서버 상태 유지 필요 없음)
router.post("/logout", auth, (req, res) => {
  res.json({ message: "로그아웃 완료" });
});

// 프로필, 비밀번호 변경 (클라이언트 API 경로와 일치시킴)
router.put("/profile", auth, userController.updateProfile);
router.put("/password", auth, userController.changePassword);

module.exports = router;
