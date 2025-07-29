// models/notificationModel.js
const db = require('../config/db');

// 알림 생성
exports.createNotification = async ({ userId, senderId, type, title, message, postId, commentId }) => {
  const [result] = await db.query(
    `INSERT INTO notifications (user_id, sender_id, type, title, message, post_id, comment_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [userId, senderId, type, title, message, postId, commentId]
  );
  return result.insertId;
};

// 사용자의 알림 목록 조회 (페이징)
exports.getUserNotifications = async (userId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  
  const [notifications] = await db.query(
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
  const [countResult] = await db.query(
    'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
    [userId]
  );

  return {
    notifications,
    total: countResult[0].total,
    page,
    limit,
    totalPages: Math.ceil(countResult[0].total / limit)
  };
};

// 읽지 않은 알림 개수 조회
exports.getUnreadCount = async (userId) => {
  const [result] = await db.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
    [userId]
  );
  return result[0].count;
};

// 알림 읽음 처리
exports.markAsRead = async (notificationId, userId) => {
  const [result] = await db.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
  return result.affectedRows > 0;
};

// 모든 알림 읽음 처리
exports.markAllAsRead = async (userId) => {
  const [result] = await db.query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
    [userId]
  );
  return result.affectedRows;
};

// 알림 삭제
exports.deleteNotification = async (notificationId, userId) => {
  const [result] = await db.query(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
  return result.affectedRows > 0;
};

// 오래된 알림 정리 (30일 이상)
exports.cleanupOldNotifications = async () => {
  const [result] = await db.query(
    'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
  );
  return result.affectedRows;
};

// 특정 게시글/댓글과 관련된 알림 삭제
exports.deleteRelatedNotifications = async (postId, commentId = null) => {
  let query = 'DELETE FROM notifications WHERE post_id = ?';
  let params = [postId];
  
  if (commentId) {
    query += ' AND comment_id = ?';
    params.push(commentId);
  }
  
  const [result] = await db.query(query, params);
  return result.affectedRows;
};
