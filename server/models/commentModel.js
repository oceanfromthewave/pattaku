const db = require("../config/db");

// 댓글 목록 (좋아요 정보 포함)
exports.getByPostIdAsync = async (postId, userId = null) => {
  let query = `
    SELECT 
      c.*,
      u.nickname as author_nickname,
      COALESCE(likes.like_count, 0) as likes,
      COALESCE(likes.dislike_count, 0) as dislikes
  `;
  
  // 로그인한 사용자의 좋아요 상태 추가
  if (userId) {
    query += `,
      CASE WHEN user_likes.vote_type = 'like' THEN 1 ELSE 0 END as isLiked,
      CASE WHEN user_likes.vote_type = 'dislike' THEN 1 ELSE 0 END as isDisliked
    `;
  } else {
    query += `,
      0 as isLiked,
      0 as isDisliked
    `;
  }
  
  query += `
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN (
      SELECT 
        comment_id,
        SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END) as like_count,
        SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END) as dislike_count
      FROM comment_likes 
      GROUP BY comment_id
    ) likes ON c.id = likes.comment_id
  `;
  
  if (userId) {
    query += `
      LEFT JOIN comment_likes user_likes ON c.id = user_likes.comment_id AND user_likes.user_id = ?
    `;
  }
  
  query += `
    WHERE c.post_id = ?
    ORDER BY 
      CASE WHEN c.parent_id IS NULL THEN c.id ELSE c.parent_id END,
      c.parent_id IS NOT NULL,
      c.created_at ASC
  `;
  
  const params = userId ? [userId, postId] : [postId];
  const [rows] = await db.query(query, params);
  return rows;
};

// findById (삭제 권한 확인용)
exports.findByIdAsync = async (id) => {
  const [rows] = await db.query("SELECT * FROM comments WHERE id = ? LIMIT 1", [
    id,
  ]);
  return rows[0];
};

// 등록
exports.createAsync = async ({
  postId,
  parentId,
  user_id,
  author,
  content,
}) => {
  const [result] = await db.query(
    "INSERT INTO comments (post_id, parent_id, user_id, author, content, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
    [postId, parentId || null, user_id, author, content]
  );
  return result;
};

// 삭제 (답글과 좋아요도 함께 삭제)
exports.deleteAsync = async (id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // 댓글의 좋아요 기록 삭제
    await connection.query(
      `DELETE FROM comment_likes WHERE comment_id = ?`,
      [id]
    );
    
    // 답글들의 좋아요 기록도 삭제
    await connection.query(
      `DELETE cl FROM comment_likes cl
       INNER JOIN comments c ON cl.comment_id = c.id
       WHERE c.parent_id = ?`,
      [id]
    );
    
    // 답글들 삭제
    await connection.query(
      `DELETE FROM comments WHERE parent_id = ?`,
      [id]
    );
    
    // 원댓글 삭제
    await connection.query("DELETE FROM comments WHERE id = ?", [id]);
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// 수정
exports.updateAsync = async (id, content) => {
  await db.query("UPDATE comments SET content = ? WHERE id = ?", [content, id]);
};

// 좋아요/싫어요 토글
exports.toggleVoteAsync = async (comment_id, user_id, vote_type) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // 기존 투표 확인
    const [existing] = await connection.query(
      `SELECT vote_type FROM comment_likes 
       WHERE comment_id = ? AND user_id = ?`,
      [comment_id, user_id]
    );
    
    if (existing.length > 0) {
      if (existing[0].vote_type === vote_type) {
        // 같은 투표 타입이면 삭제 (토글)
        await connection.query(
          `DELETE FROM comment_likes 
           WHERE comment_id = ? AND user_id = ?`,
          [comment_id, user_id]
        );
      } else {
        // 다른 투표 타입이면 업데이트
        await connection.query(
          `UPDATE comment_likes 
           SET vote_type = ?, created_at = NOW()
           WHERE comment_id = ? AND user_id = ?`,
          [vote_type, comment_id, user_id]
        );
      }
    } else {
      // 새로운 투표 추가
      await connection.query(
        `INSERT INTO comment_likes (comment_id, user_id, vote_type, created_at)
         VALUES (?, ?, ?, NOW())`,
        [comment_id, user_id, vote_type]
      );
    }
    
    // 업데이트된 투표 수 조회
    const [counts] = await connection.query(
      `SELECT 
        SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END) as like_count,
        SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END) as dislike_count
       FROM comment_likes 
       WHERE comment_id = ?`,
      [comment_id]
    );
    
    // 사용자의 현재 투표 상태 조회
    const [userVote] = await connection.query(
      `SELECT vote_type FROM comment_likes 
       WHERE comment_id = ? AND user_id = ?`,
      [comment_id, user_id]
    );
    
    await connection.commit();
    
    return {
      likeCount: counts[0]?.like_count || 0,
      dislikeCount: counts[0]?.dislike_count || 0,
      userVote: userVote[0]?.vote_type || null
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// 댓글 수 조회
exports.getCountAsync = async (post_id) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) as count FROM comments WHERE post_id = ?`,
    [post_id]
  );
  return rows[0].count;
};

// 사용자가 작성한 댓글 목록
exports.getByUserIdAsync = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  // 전체 개수 조회
  const [countResult] = await db.query(
    "SELECT COUNT(*) as total FROM comments WHERE user_id = ?",
    [userId]
  );
  const total = countResult[0].total;
  
  // 댓글 목록 조회
  const [rows] = await db.query(`
    SELECT 
      c.*,
      p.title as post_title,
      p.id as post_id,
      u.nickname as author_nickname,
      COALESCE(like_stats.like_count, 0) as likes,
      COALESCE(like_stats.dislike_count, 0) as dislikes
    FROM comments c
    LEFT JOIN posts p ON c.post_id = p.id
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN (
      SELECT 
        comment_id,
        SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END) as like_count,
        SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END) as dislike_count
      FROM comment_likes 
      GROUP BY comment_id
    ) like_stats ON c.id = like_stats.comment_id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `, [userId, limit, offset]);
  
  return {
    comments: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// 좋아요/싫어요 상태 확인
exports.checkLike = async (comment_id, user_id, vote_type) => {
  const [rows] = await db.query(
    `SELECT * FROM comment_likes WHERE comment_id = ? AND user_id = ? AND vote_type = ?`,
    [comment_id, user_id, vote_type]
  );
  return rows.length > 0;
};

// 좋아요/싫어요 추가
exports.addLike = async (comment_id, user_id, vote_type) => {
  await db.query(
    `INSERT INTO comment_likes (comment_id, user_id, vote_type, created_at) VALUES (?, ?, ?, NOW())`,
    [comment_id, user_id, vote_type]
  );
};

// 좋아요/싫어요 삭제
exports.deleteLike = async (comment_id, user_id, vote_type) => {
  await db.query(
    `DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ? AND vote_type = ?`,
    [comment_id, user_id, vote_type]
  );
};

// 좋아요/싫어요 수 조회
exports.getLikeCount = async (comment_id, vote_type) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ? AND vote_type = ?`,
    [comment_id, vote_type]
  );
  return rows[0].count;
};