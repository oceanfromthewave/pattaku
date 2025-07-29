// userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

// 기본 사용자 라우트
router.get("/", userController.getAllUsers);
router.post("/", userController.registerUser);

// 마이페이지 라우트 (로그인 필요)
router.get("/profile", auth, userController.getMyProfile);
router.put("/profile", auth, userController.updateProfile);
router.put("/password", auth, userController.changePassword);
router.get("/posts", auth, userController.getMyPosts);
router.get("/comments", auth, userController.getMyComments);
router.get("/stats", auth, userController.getMyStats);

module.exports = router;
