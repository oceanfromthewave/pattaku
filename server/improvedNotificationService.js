// notificationService.js - 개선된 버전
const notificationModel = require('./models/notificationModel');

class NotificationService {
  constructor(socketHandler) {
    this.socketHandler = socketHandler;
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

    try {
      // DB에 저장
      const notificationId = await notificationModel.createNotification(notification);
      
      // 실시간 전송용 데이터 구성
      const realTimeNotification = {
        id: notificationId,
        ...notification,
        created_at: new Date(),
        sender_nickname: senderNickname,
        post_title: postTitle,
        is_read: false,
        read: false // 클라이언트 호환성
      };

      // Socket.IO를 통한 실시간 전송
      const sent = this.socketHandler.sendNotificationToUser(postOwnerId, realTimeNotification);
      
      console.log(`🔔 댓글 알림 생성: ${notification.title} -> 사용자 ${postOwnerId} ${sent ? '(전송완료)' : '(오프라인)'}`);
      
      return notificationId;
    } catch (error) {
      console.error('댓글 알림 생성 실패:', error);
      throw error;
    }
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

    try {
      const notificationId = await notificationModel.createNotification(notification);
      
      const realTimeNotification = {
        id: notificationId,
        ...notification,
        created_at: new Date(),
        sender_nickname: senderNickname,
        post_title: postTitle,
        is_read: false,
        read: false
      };

      this.socketHandler.sendNotificationToUser(commentOwnerId, realTimeNotification);
      
      console.log(`🔔 답글 알림 생성: ${notification.title} -> 사용자 ${commentOwnerId}`);
      
      return notificationId;
    } catch (error) {
      console.error('답글 알림 생성 실패:', error);
      throw error;
    }
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

    try {
      const notificationId = await notificationModel.createNotification(notification);
      
      const realTimeNotification = {
        id: notificationId,
        ...notification,
        created_at: new Date(),
        sender_nickname: senderNickname,
        post_title: targetTitle,
        is_read: false,
        read: false
      };

      this.socketHandler.sendNotificationToUser(targetOwnerId, realTimeNotification);
      
      console.log(`🔔 좋아요 알림 생성: ${notification.title} -> 사용자 ${targetOwnerId}`);
      
      return notificationId;
    } catch (error) {
      console.error('좋아요 알림 생성 실패:', error);
      throw error;
    }
  }

  // 알림 목록 조회
  async getNotifications(userId, page = 1, limit = 20) {
    try {
      return await notificationModel.getUserNotifications(userId, page, limit);
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
      throw error;
    }
  }

  // 읽지 않은 알림 개수 조회
  async getUnreadCount(userId) {
    try {
      return await notificationModel.getUnreadCount(userId);
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 실패:', error);
      throw error;
    }
  }

  // 알림 읽음 처리
  async markAsRead(notificationId, userId) {
    try {
      const success = await notificationModel.markAsRead(notificationId, userId);
      
      if (success) {
        // 실시간으로 읽음 상태 업데이트
        const updateMsg = { 
          type: 'notification_read', 
          notificationId,
          timestamp: new Date()
        };
        this.socketHandler.sendNotificationToUser(userId, updateMsg);
        
        console.log(`✅ 알림 읽음 처리: ID ${notificationId}, 사용자 ${userId}`);
      }
      
      return success;
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      throw error;
    }
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(userId) {
    try {
      const updatedCount = await notificationModel.markAllAsRead(userId);
      
      if (updatedCount > 0) {
        // 실시간으로 모든 알림 읽음 상태 업데이트
        const updateMsg = { 
          type: 'all_notifications_read',
          updatedCount,
          timestamp: new Date()
        };
        this.socketHandler.sendNotificationToUser(userId, updateMsg);
        
        console.log(`✅ 모든 알림 읽음 처리: ${updatedCount}개, 사용자 ${userId}`);
      }
      
      return updatedCount;
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      throw error;
    }
  }

  // 알림 삭제
  async deleteNotification(notificationId, userId) {
    try {
      const success = await notificationModel.deleteNotification(notificationId, userId);
      
      if (success) {
        // 실시간으로 알림 삭제 알림
        const deleteMsg = { 
          type: 'notification_deleted', 
          notificationId,
          timestamp: new Date()
        };
        this.socketHandler.sendNotificationToUser(userId, deleteMsg);
        
        console.log(`🗑️ 알림 삭제: ID ${notificationId}, 사용자 ${userId}`);
      }
      
      return success;
    } catch (error) {
      console.error('알림 삭제 실패:', error);
      throw error;
    }
  }

  // 연결된 사용자 통계
  getConnectionStats() {
    const onlineUsers = this.socketHandler.getOnlineUsers();
    return {
      totalOnlineUsers: onlineUsers.length,
      onlineUsers: onlineUsers
    };
  }
}

module.exports = NotificationService;
