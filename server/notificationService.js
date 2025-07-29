// notificationService.js
const notificationModel = require('./models/notificationModel');

const wsMap = require('./wsNotificationMap');

class NotificationService {
  constructor(socketHandler) {
    this.socketHandler = socketHandler;
  }

  // ws(WebSocket)로 알림 전송
  sendWsNotification(userId, notification) {
    const ws = wsMap.get(String(userId));
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(notification));
      return true;
    }
    return false;
  }

  // 댓글 알림 생성
  async createCommentNotification(postOwnerId, senderId, postId, postTitle, senderNickname) {
    if (postOwnerId === senderId) return; // 자기 게시글에 댓글 단 경우 제외

    const notification = {
      userId: postOwnerId,
      senderId: senderId,
      type: 'comment',
      title: '새 댓글이 달렸습니다',
      message: `${senderNickname}님이 "${postTitle}" 게시글에 댓글을 달았습니다.`,
      postId: postId,
      commentId: null
    };

    // DB에 저장
    const notificationId = await notificationModel.createNotification(notification);
    
    // 실시간 전송
    const realTimeNotification = {
      id: notificationId,
      ...notification,
      created_at: new Date(),
      sender_nickname: senderNickname,
      post_title: postTitle,
      is_read: false
    };

    this.socketHandler.sendNotificationToUser(postOwnerId, realTimeNotification);
    this.sendWsNotification(postOwnerId, realTimeNotification);
    
    return notificationId;
  }

  // 답글 알림 생성
  async createReplyNotification(commentOwnerId, senderId, postId, commentId, postTitle, senderNickname) {
    if (commentOwnerId === senderId) return; // 자기 댓글에 답글 단 경우 제외

    const notification = {
      userId: commentOwnerId,
      senderId: senderId,
      type: 'reply',
      title: '새 답글이 달렸습니다',
      message: `${senderNickname}님이 회원님의 댓글에 답글을 달았습니다.`,
      postId: postId,
      commentId: commentId
    };

    // DB에 저장
    const notificationId = await notificationModel.createNotification(notification);
    
    // 실시간 전송
    const realTimeNotification = {
      id: notificationId,
      ...notification,
      created_at: new Date(),
      sender_nickname: senderNickname,
      post_title: postTitle,
      is_read: false
    };

    this.socketHandler.sendNotificationToUser(commentOwnerId, realTimeNotification);
    this.sendWsNotification(commentOwnerId, realTimeNotification);
    
    return notificationId;
  }

  // 좋아요 알림 생성
  async createLikeNotification(targetOwnerId, senderId, postId, commentId, type, targetTitle, senderNickname) {
    if (targetOwnerId === senderId) return; // 자기 글/댓글에 좋아요 누른 경우 제외

    const isComment = commentId !== null;
    const notification = {
      userId: targetOwnerId,
      senderId: senderId,
      type: 'like',
      title: `${isComment ? '댓글' : '게시글'}에 좋아요를 받았습니다`,
      message: `${senderNickname}님이 ${isComment ? '회원님의 댓글' : `"${targetTitle}" 게시글`}을 좋아합니다.`,
      postId: postId,
      commentId: commentId
    };

    // DB에 저장
    const notificationId = await notificationModel.createNotification(notification);
    
    // 실시간 전송
    const realTimeNotification = {
      id: notificationId,
      ...notification,
      created_at: new Date(),
      sender_nickname: senderNickname,
      post_title: targetTitle,
      is_read: false
    };

    this.socketHandler.sendNotificationToUser(targetOwnerId, realTimeNotification);
    this.sendWsNotification(targetOwnerId, realTimeNotification);
    
    return notificationId;
  }

  // 알림 목록 조회
  async getNotifications(userId, page = 1, limit = 20) {
    return await notificationModel.getUserNotifications(userId, page, limit);
  }

  // 읽지 않은 알림 개수 조회
  async getUnreadCount(userId) {
    return await notificationModel.getUnreadCount(userId);
  }

  // 알림 읽음 처리
  async markAsRead(notificationId, userId) {
    const success = await notificationModel.markAsRead(notificationId, userId);
    
    if (success) {
      // 실시간으로 읽음 상태 업데이트
      const msg = { type: 'notification_read', notificationId };
      this.socketHandler.sendNotificationToUser(userId, msg);
      this.sendWsNotification(userId, msg);
    }
    
    return success;
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(userId) {
    const updatedCount = await notificationModel.markAllAsRead(userId);
    
    if (updatedCount > 0) {
      // 실시간으로 모든 알림 읽음 상태 업데이트
      const msg = { type: 'all_notifications_read' };
      this.socketHandler.sendNotificationToUser(userId, msg);
      this.sendWsNotification(userId, msg);
    }
    
    return updatedCount;
  }

  // 알림 삭제
  async deleteNotification(notificationId, userId) {
    const success = await notificationModel.deleteNotification(notificationId, userId);
    
    if (success) {
      // 실시간으로 알림 삭제 알림
      const msg = { type: 'notification_deleted', notificationId };
      this.socketHandler.sendNotificationToUser(userId, msg);
      this.sendWsNotification(userId, msg);
    }
    
    return success;
  }
}

module.exports = NotificationService;
