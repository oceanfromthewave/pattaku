const db = require("../config/db");

// 채팅방 관련 함수들
const chatRoomModel = {
  // 모든 채팅방 조회
  getAllRoomsAsync: async () => {
    const sql = `
      SELECT 
        cr.*,
        u.nickname as creator_nickname,
        (SELECT COUNT(*) FROM chat_participants cp WHERE cp.room_id = cr.id) as participant_count,
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND cm.is_deleted = FALSE) as message_count
      FROM chat_rooms cr
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.is_active = TRUE
      ORDER BY cr.created_at DESC
    `;
    try {
      const [rows] = await db.execute(sql);
      return rows;
    } catch (error) {
      console.error("getAllRoomsAsync 오류:", error);
      return [];
    }
  },

  // ID로 채팅방 조회
  getRoomByIdAsync: async (roomId) => {
    const sql = `
      SELECT 
        cr.*,
        u.nickname as creator_nickname,
        (SELECT COUNT(*) FROM chat_participants cp WHERE cp.room_id = cr.id) as participant_count
      FROM chat_rooms cr
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.id = ? AND cr.is_active = TRUE
    `;
    try {
      const [rows] = await db.execute(sql, [roomId]);
      return rows[0] || null;
    } catch (error) {
      console.error("getRoomByIdAsync 오류:", error);
      return null;
    }
  },

  // 타입별 채팅방 조회
  getRoomsByTypeAsync: async (type) => {
    const sql = `
      SELECT 
        cr.*,
        u.nickname as creator_nickname,
        (SELECT COUNT(*) FROM chat_participants cp WHERE cp.room_id = cr.id) as participant_count
      FROM chat_rooms cr
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.type = ? AND cr.is_active = TRUE
      ORDER BY cr.created_at DESC
    `;
    try {
      const [rows] = await db.execute(sql, [type]);
      return rows;
    } catch (error) {
      console.error("getRoomsByTypeAsync 오류:", error);
      return [];
    }
  },

  // 채팅방 생성
  createRoomAsync: async ({ name, description, type, topic, created_by }) => {
    const sql = `
      INSERT INTO chat_rooms (name, description, type, topic, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;
    try {
      const [result] = await db.execute(sql, [
        name,
        description,
        type,
        topic,
        created_by,
      ]);
      return result.insertId;
    } catch (error) {
      console.error("createRoomAsync 오류:", error);
      throw error;
    }
  },

  // 채팅방 참여
  joinRoomAsync: async (roomId, userId) => {
    const sql = `
      INSERT INTO chat_participants (room_id, user_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE joined_at = CURRENT_TIMESTAMP
    `;
    try {
      await db.execute(sql, [roomId, userId]);
    } catch (error) {
      console.error("joinRoomAsync 오류:", error);
      throw error;
    }
  },

  // 채팅방 나가기
  leaveRoomAsync: async (roomId, userId) => {
    const sql = `DELETE FROM chat_participants WHERE room_id = ? AND user_id = ?`;
    try {
      await db.execute(sql, [roomId, userId]);
    } catch (error) {
      console.error("leaveRoomAsync 오류:", error);
      throw error;
    }
  },

  // 채팅방 참여자 조회
  getRoomParticipantsAsync: async (roomId) => {
    const sql = `
      SELECT 
        cp.*,
        u.nickname,
        u.profileImage
      FROM chat_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.room_id = ?
      ORDER BY cp.joined_at DESC
    `;
    try {
      const [rows] = await db.execute(sql, [roomId]);
      return rows;
    } catch (error) {
      console.error("getRoomParticipantsAsync 오류:", error);
      return [];
    }
  },

  // 사용자 참여 채팅방 조회
  getUserRoomsAsync: async (userId) => {
    const sql = `
      SELECT 
        cr.*,
        cp.joined_at,
        cp.last_read_at,
        (SELECT COUNT(*) FROM chat_messages cm 
         WHERE cm.room_id = cr.id AND cm.created_at > cp.last_read_at AND cm.is_deleted = FALSE) as unread_count
      FROM chat_rooms cr
      JOIN chat_participants cp ON cr.id = cp.room_id
      WHERE cp.user_id = ? AND cr.is_active = TRUE
      ORDER BY cp.last_read_at DESC
    `;
    
    return await retryQuery(async () => {
      const [rows] = await db.execute(sql, [userId]);
      return rows;
    });
  },

  // 1:1 채팅방 생성 또는 찾기
  getOrCreateDirectMessageAsync: async (user1Id, user2Id) => {
    return await retryQuery(async () => {
      // 기존 1:1 채팅방 찾기
      let sql = `
        SELECT dm.*, cr.name, cr.id as room_id
        FROM direct_messages dm
        JOIN chat_rooms cr ON dm.room_id = cr.id
        WHERE (dm.user1_id = ? AND dm.user2_id = ?) 
           OR (dm.user1_id = ? AND dm.user2_id = ?)
      `;
      const [rows] = await db.execute(sql, [
        user1Id,
        user2Id,
        user2Id,
        user1Id,
      ]);

      if (rows.length > 0) {
        return rows[0];
      }

      // 새 1:1 채팅방 생성
      const roomSql = `
        INSERT INTO chat_rooms (name, type, created_by)
        VALUES (?, 'private', ?)
      `;
      const [roomResult] = await db.execute(roomSql, [
        `Direct Message`,
        user1Id,
      ]);
      const roomId = roomResult.insertId;

      // direct_messages 테이블에 기록
      const dmSql = `
        INSERT INTO direct_messages (user1_id, user2_id, room_id)
        VALUES (?, ?, ?)
      `;
      await db.execute(dmSql, [
        Math.min(user1Id, user2Id),
        Math.max(user1Id, user2Id),
        roomId,
      ]);

      // 두 사용자를 채팅방에 자동 참여
      const participantSql = `INSERT INTO chat_participants (room_id, user_id) VALUES (?, ?), (?, ?)`;
      await db.execute(participantSql, [roomId, user1Id, roomId, user2Id]);

      return { room_id: roomId, user1_id: user1Id, user2_id: user2Id };
    });
  },
};

module.exports = chatRoomModel;
