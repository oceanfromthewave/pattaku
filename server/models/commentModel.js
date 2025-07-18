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
