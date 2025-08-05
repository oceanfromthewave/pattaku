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

// 프로필 이미지 컬럼 확인 (캐시 적용)
let profileImageColumn = null;
let lastChecked = 0;
const CACHE_TTL = 300000; // 5분

const getProfileImageColumn = async () => {
  const now = Date.now();
  if (profileImageColumn !== null && (now - lastChecked) < CACHE_TTL) {
    return profileImageColumn;
  }

  try {
    const [columns] = await db.execute('DESCRIBE users');
    const profileCol = columns.find(col => 
      col.Field === 'profile_image' || col.Field === 'profileImage'
    );
    
    profileImageColumn = profileCol ? profileCol.Field : null;
    lastChecked = now;
    
    console.log(`📋 프로필 이미지 컬럼 확인: ${profileImageColumn || '없음'}`);
    return profileImageColumn;
  } catch (error) {
    console.error('프로필 이미지 컬럼 확인 실패:', error);
    return null;
  }
};

// 프로필 필드 생성 헬퍼
const getProfileField = async (alias = 'sender_profile') => {
  const column = await getProfileImageColumn();
  return column ? `u.${column} as ${alias}` : `NULL as ${alias}`;
};

// 채팅 메시지 관련 함수들
const chatMessageModel = {
  // 채팅방의 메시지 조회 (페이지네이션)
  getRoomMessagesAsync: async (roomId, limit = 50, offset = 0) => {
    return await retryQuery(async () => {
      const profileField = await getProfileField('sender_profile');
      
      const sql = `
        SELECT 
          cm.*,
          u.nickname as sender_nickname,
          ${profileField},
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
      
      const [rows] = await db.execute(sql, [roomId, parseInt(limit), parseInt(offset)]);
      return rows.reverse(); // 최신 순으로 정렬
    });
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
    
    return await retryQuery(async () => {
      const [result] = await db.execute(sql, [
        room_id,
        user_id,
        message,
        message_type,
        file_url,
        reply_to,
      ]);

      // 생성된 메시지 정보 반환
      const profileField = await getProfileField('sender_profile');
      
      const msgSql = `
        SELECT 
          cm.*,
          u.nickname as sender_nickname,
          ${profileField}
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.id = ?
      `;
      const [msgRows] = await db.execute(msgSql, [result.insertId]);
      return msgRows[0];
    });
  },

  // 메시지 수정
  updateMessageAsync: async (messageId, userId, newMessage) => {
    const sql = `
      UPDATE chat_messages 
      SET message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ? AND is_deleted = FALSE
    `;
    
    return await retryQuery(async () => {
      await db.execute(sql, [newMessage, messageId, userId]);
    });
  },

  // 메시지 삭제 (소프트 삭제)
  deleteMessageAsync: async (messageId, userId) => {
    const sql = `
      UPDATE chat_messages 
      SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;
    
    return await retryQuery(async () => {
      await db.execute(sql, [messageId, userId]);
    });
  },

  // 특정 메시지 조회
  getMessageByIdAsync: async (messageId) => {
    return await retryQuery(async () => {
      const profileField = await getProfileField('sender_profile');
      
      const sql = `
        SELECT 
          cm.*,
          u.nickname as sender_nickname,
          ${profileField}
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.id = ? AND cm.is_deleted = FALSE
      `;
      
      const [rows] = await db.execute(sql, [messageId]);
      return rows[0] || null;
    });
  },

  // 읽음 상태 업데이트 (오류 처리 강화)
  updateLastReadAsync: async (roomId, userId) => {
    const sql = `
      UPDATE chat_participants 
      SET last_read_at = CURRENT_TIMESTAMP
      WHERE room_id = ? AND user_id = ?
    `;
    
    // 특별히 이 함수는 타임아웃과 재시도를 더 엄격하게 처리
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('읽음 상태 업데이트 타임아웃 (15초)')), 15000)
    );
    
    try {
      return await Promise.race([
        retryQuery(async () => {
          const [result] = await db.execute(sql, [roomId, userId]);
          return result;
        }, 2, 500), // 최대 2번 재시도, 0.5초 간격
        timeoutPromise
      ]);
    } catch (error) {
      // 읽음 상태 업데이트는 선택적 기능이므로 로그만 남기고 에러를 throw하지 않음
      console.error(`❌ 읽음 상태 업데이트 실패 (Room: ${roomId}, User: ${userId}):`, error.message);
      return null;
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
    
    return await retryQuery(async () => {
      const [rows] = await db.execute(sql, [roomId, userId, userId]);
      return rows[0].unread_count;
    });
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
    
    return await retryQuery(async () => {
      const [rows] = await db.execute(sql, [userId, userId]);
      return rows[0].total_unread;
    });
  },

  // 배치로 읽음 상태 업데이트 (성능 개선)
  batchUpdateLastReadAsync: async (updates) => {
    if (!updates || updates.length === 0) return;
    
    const sql = `
      UPDATE chat_participants 
      SET last_read_at = CURRENT_TIMESTAMP
      WHERE (room_id = ? AND user_id = ?)
    `;
    
    return await retryQuery(async () => {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        
        for (const { roomId, userId } of updates) {
          await connection.execute(sql, [roomId, userId]);
        }
        
        await connection.commit();
        console.log(`✅ 배치 읽음 상태 업데이트 완료: ${updates.length}건`);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    });
  }
};

module.exports = chatMessageModel;