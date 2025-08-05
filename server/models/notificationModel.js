// models/notificationModel.js
const db = require("../config/db");

// 재시도 헬퍼 함수
const retryQuery = async (queryFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      console.error(`쿼리 시도 ${attempt}/${maxRetries} 실패:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // ETIMEDOUT이나 PROTOCOL_CONNECTION_LOST 에러의 경우 재시도
      if (error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      // 다른 에러는 즉시 throw
      throw error;
    }
  }
};

// 알림 생성
exports.createNotification = async ({
  userId,
  senderId,
  type,
  title,
  message,
  postId,
  commentId,
}) => {
  return await retryQuery(async () => {
    const [result] = await db.execute(
      `INSERT INTO notifications (user_id, sender_id, type, title, message, post_id, comment_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, senderId, type, title, message, postId, commentId]
    );
    return result.insertId;
  });
};

// 사용자의 알림 목록 조회 (페이징)
exports.getUserNotifications = async (userId, page = 1, limit = 20) => {
  return await retryQuery(async () => {
    const offset = (page - 1) * limit;

    const [notifications] = await db.execute(
      `SELECT 
        n.*,
        sender.nickname as sender_nickname,
        p.title as post_title
       FROM notifications n
       LEFT JOIN users sender ON n.sender_id = sender.id
       LEFT JOIN posts p ON n.post_id = p.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // 전체 개수 조회
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as total FROM notifications WHERE user_id = ?",
      [userId]
    );

    return {
      notifications,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit),
    };
  });
};

// 읽지 않은 알림 개수 조회
exports.getUnreadCount = async (userId) => {
  return await retryQuery(async () => {
    const [result] = await db.execute(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );
    return result[0].count;
  });
};

// 알림 읽음 처리
exports.markAsRead = async (notificationId, userId) => {
  return await retryQuery(async () => {
    const [result] = await db.execute(
      "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  });
};

// 모든 알림 읽음 처리
exports.markAllAsRead = async (userId) => {
  return await retryQuery(async () => {
    const [result] = await db.execute(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );
    return result.affectedRows;
  });
};

// 알림 삭제
exports.deleteNotification = async (notificationId, userId) => {
  return await retryQuery(async () => {
    const [result] = await db.execute(
      "DELETE FROM notifications WHERE id = ? AND user_id = ?",
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  });
};

// 오래된 알림 정리 (30일 이상)
exports.cleanupOldNotifications = async () => {
  return await retryQuery(async () => {
    const [result] = await db.execute(
      "DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    return result.affectedRows;
  });
};

// 특정 게시글/댓글과 관련된 알림 삭제
exports.deleteRelatedNotifications = async (postId, commentId = null) => {
  return await retryQuery(async () => {
    let query = "DELETE FROM notifications WHERE post_id = ?";
    let params = [postId];

    if (commentId) {
      query += " AND comment_id = ?";
      params.push(commentId);
    }

    const [result] = await db.execute(query, params);
    return result.affectedRows;
  });
};

exports.getTotalCount = async (userId) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute(
      "SELECT COUNT(*) as total FROM notifications WHERE user_id = ?",
      [userId]
    );
    return rows[0]?.total || 0;
  });
};