// 패타쿠 커뮤니티 데이터베이스 테이블 통합 생성 스크립트
const db = require('./config/db');

async function createAllTables() {
  try {
    console.log('🚀 패타쿠 데이터베이스 테이블 통합 생성을 시작합니다...\n');

    // 1. 사용자 테이블
    console.log('1️⃣ users 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE,
        nickname VARCHAR(50) NOT NULL UNIQUE,
        profile_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_nickname (nickname)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ users 테이블 생성 완료');

    // 2. 게시글 테이블
    console.log('2️⃣ posts 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        views INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ posts 테이블 생성 완료');

    // 3. 게시글 파일 테이블
    console.log('3️⃣ post_files 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        originalname VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        INDEX idx_post_id (post_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ post_files 테이블 생성 완료');

    // 4. 게시글 좋아요/싫어요 테이블
    console.log('4️⃣ post_likes 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        type ENUM('like', 'dislike') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_post_like (post_id, user_id),
        INDEX idx_post_id (post_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ post_likes 테이블 생성 완료');

    // 5. 댓글 테이블
    console.log('5️⃣ comments 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        parent_id INT NULL,
        user_id INT NOT NULL,
        author VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_post_id (post_id),
        INDEX idx_parent_id (parent_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ comments 테이블 생성 완료');

    // 6. 알림 테이블 (notifications)
    console.log('6️⃣ notifications 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        sender_id INT,
        type ENUM('comment', 'reply', 'like', 'dislike', 'post_comment') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        post_id INT,
        comment_id INT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        INDEX idx_is_read (is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ notifications 테이블 생성 완료');

    // 7. 채팅방 테이블 (chat_rooms)
    console.log('7️⃣ chat_rooms 테이블 생성 중...');
    await db.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ chat_rooms 테이블 생성 완료');

    // 8. 채팅 메시지 테이블 (chat_messages)
    console.log('8️⃣ chat_messages 테이블 생성 중...');
    await db.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ chat_messages 테이블 생성 완료');

    // 9. 채팅방 참여자 테이블 (chat_participants)
    console.log('9️⃣ chat_participants 테이블 생성 중...');
    await db.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ chat_participants 테이블 생성 완료');

    // 10. 일정 테이블 (schedules)
    console.log('🔟 schedules 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        location VARCHAR(255),
        max_participants INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_start_date (start_date),
        INDEX idx_end_date (end_date),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ schedules 테이블 생성 완료');

    // 11. 일정 투표/댓글 관련 (간소화)
    await db.query(`
      CREATE TABLE IF NOT EXISTS schedule_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        schedule_id INT NOT NULL,
        user_id INT NOT NULL,
        vote_type ENUM('going', 'not_going', 'maybe') NOT NULL,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_schedule_vote (schedule_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 기본 채팅방 생성
    const [existingRooms] = await db.execute("SELECT COUNT(*) as count FROM chat_rooms");
    if (existingRooms[0].count === 0) {
      await db.execute(`
        INSERT INTO chat_rooms (name, description, type, topic) VALUES
        ('전체 채팅', '모든 사용자가 참여할 수 있는 전체 채팅방입니다.', 'public', 'general'),
        ('자유 주제', '자유롭게 이야기할 수 있는 공간입니다.', 'topic', 'free'),
        ('질문과 답변', '궁금한 것이 있으면 언제든 물어보세요!', 'topic', 'qna'),
        ('공지사항', '중요한 공지사항을 전달하는 채팅방입니다.', 'topic', 'notice')
      `);
      console.log('✅ 기본 채팅방 생성 완료');
    }

    console.log('\n🎉 모든 테이블이 성공적으로 생성되었습니다!');
  } catch (error) {
    console.error('❌ 테이블 생성 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

createAllTables();
