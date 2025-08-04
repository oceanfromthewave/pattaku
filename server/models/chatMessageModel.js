const db = require("../config/db");

// 채팅 메시지 관련 함수들
const chatMessageModel = {
  // 채팅방의 메시지 조회 (페이지네이션)
  getRoomMessagesAsync: async (roomId, limit = 50, offset = 0) => {
    const sql = `
      SELECT 
        cm.*,
        u.nickname as sender_nickname,
        u.profileImage as sender_profile,
        reply_msg.message as reply_message,
        reply_user.nickname as reply_user_nickname
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      LEFT JOIN chat_messages reply_msg ON cm.reply_to = reply_msg.id
      LEFT JOIN users reply_user ON reply_msg.user_id = reply_user.id
      WHERE cm.room_id = ? AND cm.is_deleted = FALSE
      ORDER BY cm.created_at DESC
      LIMIT ? OFFSET ?
    `;
    try {
      const [rows] = await db.execute(sql, [roomId, limit, offset]);
      return rows.reverse(); // 최신 순으로 정렬
    } catch (error) {
      console.error("getRoomMessagesAsync 오류:", error);
      return [];
    }
  },

  // 메시지 생성
  createMessageAsync: async ({
    room_id,
    user_id,
    message,
    message_type = "text",
    file_url = null,
    reply_to = null,
  }) => {
    const sql = `
      INSERT INTO chat_messages (room_id, user_id, message, message_type, file_url, reply_to)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    try {
      const [result] = await db.execute(sql, [
        room_id,
        user_id,
        message,
        message_type,
        file_url,
        reply_to,
      ]);

      // 생성된 메시지 정보 반환
      const msgSql = `
        SELECT 
          cm.*,
          u.nickname as sender_nickname,
          u.profileImage as sender_profile
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.id = ?
      `;
      const [msgRows] = await db.execute(msgSql, [result.insertId]);
      return msgRows[0];
    } catch (error) {
      console.error("createMessageAsync 오류:", error);
      throw error;
    }
  },

  // 메시지 수정
  updateMessageAsync: async (messageId, userId, newMessage) => {
    const sql = `
      UPDATE chat_messages 
      SET message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ? AND is_deleted = FALSE
    `;
    try {
      await db.execute(sql, [newMessage, messageId, userId]);
    } catch (error) {
      console.error("updateMessageAsync 오류:", error);
      throw error;
    }
  },

  // 메시지 삭제 (소프트 삭제)
  deleteMessageAsync: async (messageId, userId) => {
    const sql = `
      UPDATE chat_messages 
      SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;
    try {
      await db.execute(sql, [messageId, userId]);
    } catch (error) {
      console.error("deleteMessageAsync 오류:", error);
      throw error;
    }
  },

  // 특정 메시지 조회
  getMessageByIdAsync: async (messageId) => {
    const sql = `
      SELECT 
        cm.*,
        u.nickname as sender_nickname,
        u.profileImage as sender_profile
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.id = ? AND cm.is_deleted = FALSE
    `;
    try {
      const [rows] = await db.execute(sql, [messageId]);
      return rows[0] || null;
    } catch (error) {
      console.error("getMessageByIdAsync 오류:", error);
      return null;
    }
  },

  // 읽음 상태 업데이트
  updateLastReadAsync: async (roomId, userId) => {
    const sql = `
      UPDATE chat_participants 
      SET last_read_at = CURRENT_TIMESTAMP
      WHERE room_id = ? AND user_id = ?
    `;
    try {
      await db.execute(sql, [roomId, userId]);
    } catch (error) {
      console.error("updateLastReadAsync 오류:", error);
      throw error;
    }
  },

  // 안읽은 메시지 수 조회
  getUnreadCountAsync: async (roomId, userId) => {
    const sql = `
      SELECT COUNT(*) as unread_count
      FROM chat_messages cm
      JOIN chat_participants cp ON cm.room_id = cp.room_id
      WHERE cm.room_id = ? AND cp.user_id = ? 
        AND cm.created_at > cp.last_read_at 
        AND cm.user_id != ? 
        AND cm.is_deleted = FALSE
    `;
    try {
      const [rows] = await db.execute(sql, [roomId, userId, userId]);
      return rows[0].unread_count;
    } catch (error) {
      console.error("getUnreadCountAsync 오류:", error);
      return 0;
    }
  },

  // 사용자의 전체 안읽은 메시지 수
  getTotalUnreadCountAsync: async (userId) => {
    const sql = `
      SELECT COUNT(*) as total_unread
      FROM chat_messages cm
      JOIN chat_participants cp ON cm.room_id = cp.room_id
      WHERE cp.user_id = ? 
        AND cm.created_at > cp.last_read_at 
        AND cm.user_id != ? 
        AND cm.is_deleted = FALSE
    `;
    try {
      const [rows] = await db.execute(sql, [userId, userId]);
      return rows[0].total_unread;
    } catch (error) {
      console.error("getTotalUnreadCountAsync 오류:", error);
      return 0;
    }
  },
};

module.exports = chatMessageModel;
