const db = require("../config/db");

// 댓글 목록(닉네임/유저 id 반환, 필요시 Join)
exports.getByPostIdAsync = async (postId) => {
  const [rows] = await db.query(
    `
      SELECT c.*, u.nickname as author_nickname
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `,
    [postId]
  );
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
    "INSERT INTO comments (post_id, parent_id, user_id, author, content) VALUES (?, ?, ?, ?, ?)",
    [postId, parentId || null, user_id, author, content]
  );
  return result;
};

// 삭제
exports.deleteAsync = async (id) => {
  await db.query("DELETE FROM comments WHERE id = ?", [id]);
};

// 수정
exports.updateAsync = async (id, content) => {
  await db.query("UPDATE comments SET content = ? WHERE id = ?", [content, id]);
};

// 댓글 좋아요/싫어요 추가
exports.addLike = async (commentId, userId, type) => {
  await db.query(
    "INSERT INTO comment_likes (comment_id, user_id, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE created_at=NOW()",
    [commentId, userId, type]
  );
};

// 댓글 좋아요/싫어요 여부 확인
exports.checkLike = async (commentId, userId, type) => {
  const [rows] = await db.query(
    "SELECT id FROM comment_likes WHERE comment_id=? AND user_id=? AND type=?",
    [commentId, userId, type]
  );
  return rows.length > 0;
};

// 댓글 좋아요/싫어요 취소 (삭제)
exports.deleteLike = async (commentId, userId, type) => {
  await db.query(
    "DELETE FROM comment_likes WHERE comment_id=? AND user_id=? AND type=?",
    [commentId, userId, type]
  );
};

// 댓글 좋아요/싫어요 개수
exports.getLikeCount = async (commentId, type) => {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS cnt FROM comment_likes WHERE comment_id=? AND type=?",
    [commentId, type]
  );
  return rows[0].cnt;
};
