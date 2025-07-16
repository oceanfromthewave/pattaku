const db = require("../config/db");

// 게시글별 댓글/대댓글 목록 (닉네임 조인)
exports.getByPostIdAsync = async (postId) => {
  const [rows] = await db
    .promise()
    .query(`SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC`, [
      postId,
    ]);
  return rows;
};

// 댓글/대댓글 등록 (user_id 기반!)
exports.createAsync = async ({
  postId,
  parentId,
  user_id,
  author,
  content,
}) => {
  const [result] = await db
    .promise()
    .query(
      "INSERT INTO comments (post_id, parent_id, user_id, author, content) VALUES (?, ?, ?, ?, ?)",
      [postId, parentId || null, user_id, author, content]
    );
  return result;
};

// 댓글/대댓글 삭제
exports.deleteAsync = async (id) => {
  await db.promise().query("DELETE FROM comments WHERE id = ?", [id]);
};
