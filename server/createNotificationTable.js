-- 알림 테이블 생성 스크립트
const db = require('./config/db');

async function createNotificationTable() {
  try {
    console.log('🔔 알림 테이블 생성 중...');

    // 알림 테이블 생성
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
    
  } catch (error) {
    console.error('❌ 알림 테이블 생성 중 오류:', error);
  } finally {
    process.exit(0);
  }
}

createNotificationTable();
