// 스케줄 댓글 좋아요 테이블 생성 스크립트
const db = require('./config/db');

async function createScheduleCommentLikesTable() {
  try {
    // 테이블 생성
    await db.query(`
      CREATE TABLE IF NOT EXISTS schedule_comment_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comment_id INT NOT NULL,
        user_id INT NOT NULL,
        vote_type ENUM('like', 'dislike') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_comment_vote (comment_id, user_id),
        INDEX idx_schedule_comment_likes_comment_id (comment_id),
        INDEX idx_schedule_comment_likes_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ schedule_comment_likes 테이블과 인덱스가 생성되었습니다.');
    
  } catch (error) {
    console.error('❌ 테이블 생성 중 오류:', error);
  } finally {
    process.exit(0);
  }
}

createScheduleCommentLikesTable();
