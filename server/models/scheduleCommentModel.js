const db = require("../config/db");

// 스케줄 댓글 목록 조회 (댓글과 답글)
exports.listAsync = async (schedule_id, user_id = null) => {
  let query = `
    SELECT 
      c.id, 
      c.content, 
      c.created_at, 
      c.parent_id, 
      c.user_id,
      u.nickname AS author_nickname, 
      u.username AS author,
      COALESCE(likes.like_count, 0) as likes,
      COALESCE(likes.dislike_count, 0) as dislikes
  `;
  
  // 로그인한 사용자의 좋아요 상태 추가
  if (user_id) {
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
    FROM schedule_comments c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN (
      SELECT 
        comment_id,
        SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END) as like_count,
        SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END) as dislike_count
      FROM schedule_comment_likes 
      GROUP BY comment_id
    ) likes ON c.id = likes.comment_id
  `;
  
  if (user_id) {
    query += `
      LEFT JOIN schedule_comment_likes user_likes ON c.id = user_likes.comment_id AND user_likes.user_id = ?
    `;
  }
  
  query += `
    WHERE c.schedule_id = ?
    ORDER BY 
      CASE WHEN c.parent_id IS NULL THEN c.id ELSE c.parent_id END,
      c.parent_id IS NOT NULL,
      c.created_at ASC
  `;
  
  const params = user_id ? [user_id, schedule_id] : [schedule_id];
  const [rows] = await db.query(query, params);
  return rows;
};

// 댓글 등록 (파일 업로드 지원)
exports.createAsync = async (
  schedule_id,
  user_id,
  content,
  parent_id = null,
  file_url = null,
  file_name = null
) => {
  const [result] = await db.query(
    `INSERT INTO schedule_comments (schedule_id, user_id, content, parent_id, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [schedule_id, user_id, content, parent_id]
  );
  return result.insertId;
};

// 댓글 수정
exports.updateAsync = async (commentId, content) => {
  const [result] = await db.query(
    `UPDATE schedule_comments 
     SET content = ? 
     WHERE id = ?`,
    [content, commentId]
  );
  return result.affectedRows;
};

// 댓글 삭제 (본인만)
exports.removeAsync = async (commentId, user_id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // 댓글의 좋아요 기록 삭제
    await connection.query(
      `DELETE FROM schedule_comment_likes WHERE comment_id = ?`,
      [commentId]
    );
    
    // 답글들의 좋아요 기록도 삭제
    await connection.query(
      `DELETE scl FROM schedule_comment_likes scl
       INNER JOIN schedule_comments sc ON scl.comment_id = sc.id
       WHERE sc.parent_id = ?`,
      [commentId]
    );
    
    // 답글들 먼저 삭제
    await connection.query(
      `DELETE FROM schedule_comments WHERE parent_id = ?`,
      [commentId]
    );
    
    // 원댓글 삭제
    const [result] = await connection.query(
      `DELETE FROM schedule_comments WHERE id = ? AND user_id = ?`,
      [commentId, user_id]
    );
    
    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// 댓글 상세 조회 (권한 체크용)
exports.findByIdAsync = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM schedule_comments WHERE id = ?",
    [id]
  );
  return rows[0];
};

// 댓글 수 조회
exports.getCountAsync = async (schedule_id) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) as count FROM schedule_comments WHERE schedule_id = ?`,
    [schedule_id]
  );
  return rows[0].count;
};

// 좋아요/싫어요 토글
exports.toggleVoteAsync = async (comment_id, user_id, vote_type) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // 기존 투표 확인
    const [existing] = await connection.query(
      `SELECT vote_type FROM schedule_comment_likes 
       WHERE comment_id = ? AND user_id = ?`,
      [comment_id, user_id]
    );
    
    if (existing.length > 0) {
      if (existing[0].vote_type === vote_type) {
        // 같은 투표 타입이면 삭제 (토글)
        await connection.query(
          `DELETE FROM schedule_comment_likes 
           WHERE comment_id = ? AND user_id = ?`,
          [comment_id, user_id]
        );
      } else {
        // 다른 투표 타입이면 업데이트
        await connection.query(
          `UPDATE schedule_comment_likes 
           SET vote_type = ?, created_at = NOW()
           WHERE comment_id = ? AND user_id = ?`,
          [vote_type, comment_id, user_id]
        );
      }
    } else {
      // 새로운 투표 추가
      await connection.query(
        `INSERT INTO schedule_comment_likes (comment_id, user_id, vote_type, created_at)
         VALUES (?, ?, ?, NOW())`,
        [comment_id, user_id, vote_type]
      );
    }
    
    // 업데이트된 투표 수 조회
    const [counts] = await connection.query(
      `SELECT 
        SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END) as like_count,
        SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END) as dislike_count
       FROM schedule_comment_likes 
       WHERE comment_id = ?`,
      [comment_id]
    );
    
    // 사용자의 현재 투표 상태 조회
    const [userVote] = await connection.query(
      `SELECT vote_type FROM schedule_comment_likes 
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