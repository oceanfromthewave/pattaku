const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

// 모든 알림 라우트에 initNotificationService 미들웨어 적용
router.use(notificationController.initNotificationService);

// 읽지 않은 알림 개수 조회
router.get("/unread-count", authMiddleware, notificationController.getUnreadCount);

// 사용자의 모든 알림 조회
router.get("/", authMiddleware, notificationController.getNotifications);

// 특정 알림을 읽음으로 표시
router.put("/:id/read", authMiddleware, notificationController.markAsRead);

// 모든 알림을 읽음으로 표시
router.put("/read-all", authMiddleware, notificationController.markAllAsRead);

// 특정 알림 삭제
router.delete("/:id", authMiddleware, notificationController.deleteNotification);

module.exports = router;
