const db = require("./config/db");

async function createChatTables() {
  try {
    console.log("🗄️ 채팅 테이블 생성 시작...");

    // 채팅방 테이블
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type ENUM('public', 'topic', 'private') NOT NULL DEFAULT 'public',
        topic VARCHAR(50),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        max_users INT DEFAULT 50,
        INDEX idx_type (type),
        INDEX idx_topic (topic),
        INDEX idx_created_by (created_by),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 채팅 메시지 테이블
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        message_type ENUM('text', 'image', 'file') DEFAULT 'text',
        file_url VARCHAR(500),
        reply_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_deleted BOOLEAN DEFAULT FALSE,
        INDEX idx_room_id (room_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        INDEX idx_reply_to (reply_to),
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reply_to) REFERENCES chat_messages(id) ON DELETE SET NULL
      )
    `);

    // 채팅방 참여자 테이블
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE,
        is_muted BOOLEAN DEFAULT FALSE,
        UNIQUE KEY unique_room_user (room_id, user_id),
        INDEX idx_room_id (room_id),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 1:1 채팅방 테이블
    await db.execute(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user1_id INT NOT NULL,
        user2_id INT NOT NULL,
        room_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_users (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id)),
        INDEX idx_user1 (user1_id),
        INDEX idx_user2 (user2_id),
        INDEX idx_room (room_id),
        FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
      )
    `);

    // 기본 채팅방 생성
    const [existingRooms] = await db.execute(
      "SELECT COUNT(*) as count FROM chat_rooms"
    );
    if (existingRooms[0].count === 0) {
      await db.execute(`
        INSERT INTO chat_rooms (name, description, type, topic) VALUES
        ('전체 채팅', '모든 사용자가 참여할 수 있는 전체 채팅방입니다.', 'public', 'general'),
        ('자유 주제', '자유롭게 이야기할 수 있는 공간입니다.', 'topic', 'free'),
        ('질문과 답변', '궁금한 것이 있으면 언제든 물어보세요!', 'topic', 'qna'),
        ('공지사항', '중요한 공지사항을 전달하는 채팅방입니다.', 'topic', 'notice')
      `);
      console.log("✅ 기본 채팅방 생성 완료");
    }

    console.log("✅ 채팅 테이블 생성 완료");
    process.exit(0);
  } catch (error) {
    console.error("❌ 채팅 테이블 생성 실패:", error);
    process.exit(1);
  }
}

createChatTables();
