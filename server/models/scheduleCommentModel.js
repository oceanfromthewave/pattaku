const db = require("../config/db");

// 목록 조회 (댓글과 답글)
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
      0 as likes,
      0 as dislikes,
      0 as isLiked,
      0 as isDisliked
    FROM schedule_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.schedule_id = ?
    ORDER BY 
      CASE WHEN c.parent_id IS NULL THEN c.id ELSE c.parent_id END,
      c.parent_id IS NOT NULL,
      c.created_at ASC
  `;
  
  const [rows] = await db.query(query, [schedule_id]);
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
  // 답글들 먼저 삭제
  await db.query(
    `DELETE FROM schedule_comments WHERE parent_id = ?`,
    [commentId]
  );
  
  // 원댓글 삭제
  const [result] = await db.query(
    `DELETE FROM schedule_comments WHERE id = ? AND user_id = ?`,
    [commentId, user_id]
  );
  
  return result.affectedRows;
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