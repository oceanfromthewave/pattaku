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

exports.db = db; // 다른 파일에서 db 접근용

exports.createAsync = async ({ user_id, title, content }) => {
  return await retryQuery(async () => {
    const [result] = await db.execute(
      "INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)",
      [user_id, title, content]
    );
    return result;
  });
};

exports.getAllAsync = async () => {
  return await retryQuery(async () => {
    const [rows] = await db.execute(
      `SELECT posts.*, users.nickname AS author_nickname 
       FROM posts
       LEFT JOIN users ON posts.user_id = users.id
       ORDER BY posts.created_at DESC`
    );
    return rows;
  });
};

// 페이지네이션이 적용된 게시글 조회
exports.getAllWithPaginationAsync = async (query, params) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute(query, params);
    return rows;
  });
};

exports.getByIdAsync = async (id) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute(
      `SELECT posts.*, users.nickname AS author_nickname
      FROM posts
      LEFT JOIN users ON posts.user_id = users.id
      WHERE posts.id = ?`,
      [id]
    );
    return rows[0];
  });
};

// 조회수 증가 (최적화된 컬럼명 사용)
exports.incrementViewsAsync = async (id) => {
  return await retryQuery(async () => {
    await db.execute("UPDATE posts SET view_count = view_count + 1 WHERE id = ?", [id]);
  });
};

exports.updateAsync = async (id, title, content) => {
  return await retryQuery(async () => {
    await db.execute("UPDATE posts SET title=?, content=? WHERE id=?", [
      title,
      content,
      id,
    ]);
  });
};

exports.deleteAsync = async (id) => {
  return await retryQuery(async () => {
    await db.execute("DELETE FROM posts WHERE id=?", [id]);
  });
};

exports.addFilesAsync = async (postId, files) => {
  if (!files || files.length === 0) return;
  
  return await retryQuery(async () => {
    const vals = files.map((f) => [postId, f.filename, f.originalname]);
    await db.execute(
      "INSERT INTO post_files (post_id, filename, originalname) VALUES ?",
      [vals]
    );
  });
};

exports.getFilesAsync = async (postId) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute(
      "SELECT filename, originalname FROM post_files WHERE post_id = ?",
      [postId]
    );
    return rows;
  });
};

exports.deleteFileAsync = async (postId, filename) => {
  return await retryQuery(async () => {
    await db.execute("DELETE FROM post_files WHERE post_id = ? AND filename = ?", [
      postId,
      filename,
    ]);
  });
};

// 추천/싫어요 추가
exports.addPostLike = async (postId, userId, type) => {
  return await retryQuery(async () => {
    await db.execute(
      "INSERT INTO post_likes (user_id, post_id, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE created_at=NOW()",
      [userId, postId, type]
    );
  });
};

// 추천/싫어요 여부 확인
exports.checkPostLike = async (postId, userId, type) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute(
      "SELECT id FROM post_likes WHERE user_id=? AND post_id=? AND type=?",
      [userId, postId, type]
    );
    return rows.length > 0;
  });
};

// 추천/싫어요 취소 (삭제)
exports.deletePostLike = async (postId, userId, type) => {
  return await retryQuery(async () => {
    await db.execute(
      "DELETE FROM post_likes WHERE user_id=? AND post_id=? AND type=?",
      [userId, postId, type]
    );
  });
};

// 추천/싫어요 개수
exports.getLikeCount = async (postId, type) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS cnt FROM post_likes WHERE post_id=? AND type=?",
      [postId, type]
    );
    return rows[0].cnt;
  });
};

// 사용자별 좋아요/싫어요 상태 조회 (새로 추가)
exports.getUserLikeStatus = async (postId, userId) => {
  return await retryQuery(async () => {
    const [rows] = await db.execute(
      "SELECT type FROM post_likes WHERE post_id=? AND user_id=?",
      [postId, userId]
    );
    
    if (rows.length === 0) {
      return { liked: false, disliked: false };
    }
    
    const type = rows[0].type;
    return {
      liked: type === 'like',
      disliked: type === 'dislike'
    };
  });
};

// 모든 좋아요/싫어요 정보 조회 (새로 추가)
exports.getPostLikeInfo = async (postId, userId = null) => {
  return await retryQuery(async () => {
    // 좋아요/싫어요 개수 조회
    const [likeCounts] = await db.execute(
      `SELECT 
        SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) as likes,
        SUM(CASE WHEN type = 'dislike' THEN 1 ELSE 0 END) as dislikes
       FROM post_likes WHERE post_id = ?`,
      [postId]
    );
    
    const result = {
      likes: likeCounts[0]?.likes || 0,
      dislikes: likeCounts[0]?.dislikes || 0,
      liked: false,
      disliked: false
    };
    
    // 사용자가 지정된 경우 사용자의 상태 조회
    if (userId) {
      const userStatus = await exports.getUserLikeStatus(postId, userId);
      result.liked = userStatus.liked;
      result.disliked = userStatus.disliked;
    }
    
    return result;
  });
};

// 사용자가 작성한 게시글 목록
exports.getByUserIdAsync = async (userId, page = 1, limit = 10) => {
  return await retryQuery(async () => {
    const offset = (page - 1) * limit;
    
    // 전체 개수 조회
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as total FROM posts WHERE user_id = ?",
      [userId]
    );
    const total = countResult[0].total;
    
    // 게시글 목록 조회
    const [rows] = await db.execute(`
      SELECT 
        posts.*,
        users.nickname AS author_nickname,
        COALESCE(like_stats.like_count, 0) as likes,
        COALESCE(like_stats.dislike_count, 0) as dislikes,
        COALESCE(comment_count.count, 0) as comment_count
      FROM posts
      LEFT JOIN users ON posts.user_id = users.id
      LEFT JOIN (
        SELECT 
          post_id,
          SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) as like_count,
          SUM(CASE WHEN type = 'dislike' THEN 1 ELSE 0 END) as dislike_count
        FROM post_likes 
        GROUP BY post_id
      ) like_stats ON posts.id = like_stats.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as count 
        FROM comments 
        GROUP BY post_id
      ) comment_count ON posts.id = comment_count.post_id
      WHERE posts.user_id = ?
      ORDER BY posts.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
    
    return {
      posts: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  });
};