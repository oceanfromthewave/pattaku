const NotificationService = require("../notificationService");
const notificationModel = require("../models/notificationModel");

let notificationService; // notificationService 인스턴스를 저장할 변수

// 미들웨어에서 req.app.get('socketHandler')를 통해 socketHandler를 주입받아 NotificationService 인스턴스 생성
exports.initNotificationService = (req, res, next) => {
  if (!notificationService) {
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      notificationService = new NotificationService(socketHandler);
    } else {
      console.warn("SocketHandler not found on app. NotificationService will not send real-time notifications.");
    }
  }
  next();
};

// 사용자의 읽지 않은 알림 개수 조회
exports.getUnreadCount = async (req, res) => {
  const userId = req.user.id;
  try {
    const count = await notificationModel.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

// 사용자의 모든 알림 조회
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const notifications = await notificationModel.getUserNotifications(userId, page, limit);
    const totalCount = await notificationModel.getTotalCount(userId);
    res.json({ notifications, totalCount, page, limit });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// 특정 알림을 읽음으로 표시
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const success = await notificationModel.markAsRead(id, userId);
    if (success) {
      // 실시간 업데이트를 위해 socketHandler를 통해 알림
      if (notificationService) {
        notificationService.socketHandler.sendNotificationToUser(userId, {
          type: 'notification_read',
          notificationId: parseInt(id)
        });
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "Notification not found or not authorized" });
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// 모든 알림을 읽음으로 표시
exports.markAllAsRead = async (req, res) => {
  const userId = req.user.id;
  try {
    const updatedCount = await notificationModel.markAllAsRead(userId);
    if (updatedCount > 0) {
      // 실시간 업데이트를 위해 socketHandler를 통해 알림
      if (notificationService) {
        notificationService.socketHandler.sendNotificationToUser(userId, {
          type: 'all_notifications_read'
        });
      }
    }
    res.json({ success: true, updatedCount });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

// 특정 알림 삭제
exports.deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const success = await notificationModel.deleteNotification(id, userId);
    if (success) {
      // 실시간 업데이트를 위해 socketHandler를 통해 알림
      if (notificationService) {
        notificationService.socketHandler.sendNotificationToUser(userId, {
          type: 'notification_deleted',
          notificationId: parseInt(id)
        });
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "Notification not found or not authorized" });
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};
