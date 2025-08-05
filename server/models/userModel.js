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

// 전체 유저 조회
exports.getAllAsync = async () => {
  return await retryQuery(async () => {
    const [rows] = await db.execute(
      "SELECT id, username, email, nickname, created_at FROM users"
    );
    return rows;
  });
};

// 회원가입
exports.createAsync = async ({ username, password, email, nickname }) => {
  return await retryQuery(async () => {
    const [result] = await db.execute(
      "INSERT INTO users (username, password, email, nickname) VALUES (?, ?, ?, ?)",
      [username, password, email, nickname]
    );
    return result;
  });
};

// 아이디로 유저 조회
exports.findByIdAsync = async (id) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  });
};

// 이름으로 유저 조회
exports.findByUsernameAsync = async (username) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);
    return rows[0];
  });
};

// 이메일로 유저 조회
exports.findByEmailAsync = async (email) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  });
};

// 닉네임으로 유저 조회
exports.findByNicknameAsync = async (nickname) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute("SELECT * FROM users WHERE nickname = ?", [nickname]);
    return rows[0];
  });
};

// 프로필 업데이트
exports.updateProfileAsync = async (userId, { nickname, email }) => {
  return await retryQuery(async () => {
    let query = "UPDATE users SET nickname = ?";
    let params = [nickname];

    if (email !== undefined) {
      query += ", email = ?";
      params.push(email);
    }

    query += " WHERE id = ?";
    params.push(userId);

    const [result] = await db.execute(query, params);
    return result.affectedRows;
  });
};

// 비밀번호 업데이트
exports.updatePasswordAsync = async (userId, hashedPassword) => {
  return await retryQuery(async () => {
    const [result] = await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );
    return result.affectedRows;
  });
};

// 사용자 활동 통계
exports.getUserStatsAsync = async (userId) => {
  return await retryQuery(async () => {
    // 작성한 게시글 수
    const [postCount] = await db.execute(
      "SELECT COUNT(*) as count FROM posts WHERE user_id = ?",
      [userId]
    );

    // 작성한 댓글 수
    const [commentCount] = await db.execute(
      "SELECT COUNT(*) as count FROM comments WHERE user_id = ?",
      [userId]
    );

    // 받은 좋아요 수 (게시글)
    const [postLikes] = await db.execute(
      `
      SELECT COUNT(*) as count 
      FROM post_likes pl 
      JOIN posts p ON pl.post_id = p.id 
      WHERE p.user_id = ? AND pl.type = 'like'
    `,
      [userId]
    );

    // 받은 좋아요 수 (댓글)
    const [commentLikes] = await db.execute(
      `
      SELECT COUNT(*) as count 
      FROM comment_likes cl 
      JOIN comments c ON cl.comment_id = c.id 
      WHERE c.user_id = ? AND cl.vote_type = 'like'
    `,
      [userId]
    );

    return {
      postCount: postCount[0].count,
      commentCount: commentCount[0].count,
      totalLikes: postLikes[0].count + commentLikes[0].count,
      postLikes: postLikes[0].count,
      commentLikes: commentLikes[0].count,
    };
  });
};

// 프로필 이미지 업데이트 (동적 컬럼 처리)
exports.updateProfileImageAsync = async (userId, profileImagePath) => {
  return await retryQuery(async () => {
    // 먼저 컬럼이 존재하는지 확인
    const [columns] = await db.execute('DESCRIBE users');
    const hasProfileImage = columns.some(col => 
      col.Field === 'profile_image' || col.Field === 'profileImage'
    );
    
    if (!hasProfileImage) {
      console.warn('프로필 이미지 컬럼이 없습니다. 업데이트를 건너뜁니다.');
      return 0;
    }
    
    const profileCol = columns.find(col => 
      col.Field === 'profile_image' || col.Field === 'profileImage'
    );
    
    const [result] = await db.execute(
      `UPDATE users SET ${profileCol.Field} = ? WHERE id = ?`,
      [profileImagePath, userId]
    );
    return result.affectedRows;
  });
};

// 현재 프로필 이미지 경로 조회 (동적 컬럼 처리)
exports.getProfileImageAsync = async (userId) => {
  return await retryQuery(async () => {
    // 먼저 컬럼이 존재하는지 확인
    const [columns] = await db.execute('DESCRIBE users');
    const profileCol = columns.find(col => 
      col.Field === 'profile_image' || col.Field === 'profileImage'
    );
    
    if (!profileCol) {
      return null;
    }
    
    const [rows] = await db.execute(
      `SELECT ${profileCol.Field} as profile_image FROM users WHERE id = ?`,
      [userId]
    );
    return rows[0]?.profile_image || null;
  });
};

// 프로필 이미지 삭제 (동적 컬럼 처리)
exports.deleteProfileImageAsync = async (userId) => {
  return await retryQuery(async () => {
    // 먼저 컬럼이 존재하는지 확인
    const [columns] = await db.execute('DESCRIBE users');
    const profileCol = columns.find(col => 
      col.Field === 'profile_image' || col.Field === 'profileImage'
    );
    
    if (!profileCol) {
      console.warn('프로필 이미지 컬럼이 없습니다. 삭제를 건너뜁니다.');
      return 0;
    }
    
    const [result] = await db.execute(
      `UPDATE users SET ${profileCol.Field} = NULL WHERE id = ?`,
      [userId]
    );
    return result.affectedRows;
  });
};