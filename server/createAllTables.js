// 패타쿠 커뮤니티 데이터베이스 테이블 생성 스크립트
const db = require('./config/db');

async function createAllTables() {
  try {
    console.log('🚀 패타쿠 데이터베이스 테이블 생성을 시작합니다...\n');

    // 1. 사용자 테이블
    console.log('1️⃣ users 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE,
        nickname VARCHAR(50) NOT NULL UNIQUE,
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

    // 6. 댓글 좋아요/싫어요 테이블
    console.log('6️⃣ comment_likes 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comment_id INT NOT NULL,
        user_id INT NOT NULL,
        vote_type ENUM('like', 'dislike') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_comment_vote (comment_id, user_id),
        INDEX idx_comment_id (comment_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ comment_likes 테이블 생성 완료');

    // 7. 일정 테이블
    console.log('7️⃣ schedules 테이블 생성 중...');
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

    // 8. 일정 투표 테이블
    console.log('8️⃣ schedule_votes 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS schedule_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        schedule_id INT NOT NULL,
        user_id INT NOT NULL,
        vote_type ENUM('going', 'not_going', 'maybe') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_schedule_vote (schedule_id, user_id),
        INDEX idx_schedule_id (schedule_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ schedule_votes 테이블 생성 완료');

    // 9. 일정 댓글 테이블
    console.log('9️⃣ schedule_comments 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS schedule_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        schedule_id INT NOT NULL,
        parent_id INT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES schedule_comments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_schedule_id (schedule_id),
        INDEX idx_parent_id (parent_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ schedule_comments 테이블 생성 완료');

    // 10. 일정 댓글 좋아요/싫어요 테이블
    console.log('🔟 schedule_comment_likes 테이블 생성 중...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS schedule_comment_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comment_id INT NOT NULL,
        user_id INT NOT NULL,
        vote_type ENUM('like', 'dislike') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comment_id) REFERENCES schedule_comments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_comment_vote (comment_id, user_id),
        INDEX idx_comment_id (comment_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ schedule_comment_likes 테이블 생성 완료');

    // 성능 최적화를 위한 복합 인덱스 추가
    console.log('\n🔧 성능 최적화 인덱스 추가 중...');
    
    try {
      await db.query('ALTER TABLE posts ADD INDEX idx_user_created (user_id, created_at)');
      console.log('✅ posts 복합 인덱스 추가 완료');
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.log('⚠️ posts 복합 인덱스는 이미 존재합니다.');
      }
    }

    try {
      await db.query('ALTER TABLE comments ADD INDEX idx_post_created (post_id, created_at)');
      console.log('✅ comments(post) 복합 인덱스 추가 완료');
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.log('⚠️ comments(post) 복합 인덱스는 이미 존재합니다.');
      }
    }

    try {
      await db.query('ALTER TABLE comments ADD INDEX idx_user_created_comments (user_id, created_at)');
      console.log('✅ comments(user) 복합 인덱스 추가 완료');
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.log('⚠️ comments(user) 복합 인덱스는 이미 존재합니다.');
      }
    }

    console.log('\n🎉 모든 테이블이 성공적으로 생성되었습니다!');
    console.log('\n📋 생성된 테이블 목록:');
    console.log('   1. users - 사용자 정보');
    console.log('   2. posts - 게시글');
    console.log('   3. post_files - 게시글 첨부파일');
    console.log('   4. post_likes - 게시글 좋아요/싫어요');
    console.log('   5. comments - 댓글');
    console.log('   6. comment_likes - 댓글 좋아요/싫어요');
    console.log('   7. schedules - 일정');
    console.log('   8. schedule_votes - 일정 투표');
    console.log('   9. schedule_comments - 일정 댓글');
    console.log('   10. schedule_comment_likes - 일정 댓글 좋아요/싫어요');
    console.log('\n✨ 이제 패타쿠 커뮤니티를 사용할 준비가 완료되었습니다!');

  } catch (error) {
    console.error('❌ 테이블 생성 중 오류가 발생했습니다:', error);
    console.log('\n🔧 문제 해결 방법:');
    console.log('1. MySQL/MariaDB 서버가 실행 중인지 확인');
    console.log('2. .env 파일의 데이터베이스 연결 정보 확인');
    console.log('3. 데이터베이스가 존재하는지 확인');
    console.log('4. 사용자 권한이 충분한지 확인');
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
createAllTables();
