const db = require("../config/db");

// 등록
exports.createAsync = async ({ user_id, title, content }) => {
  const [result] = await db.query(
    "INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)",
    [user_id, title, content]
  );
  return result;
};

// 전체목록
exports.getAllAsync = async () => {
  const [rows] = await db.query(
    `SELECT posts.*, users.nickname AS author_nickname 
     FROM posts
     LEFT JOIN users ON posts.user_id = users.id
     ORDER BY posts.created_at DESC`
  );
  return rows;
};

// 상세조회
exports.getByIdAsync = async (id) => {
  const [rows] = await db.query(
    `SELECT posts.*, users.nickname AS author_nickname 
     FROM posts
     LEFT JOIN users ON posts.user_id = users.id
     WHERE posts.id = ?`,
    [id]
  );
  return rows[0];
};

// 수정
exports.updateAsync = async (id, title, content) => {
  await db.query("UPDATE posts SET title=?, content=? WHERE id=?", [
    title,
    content,
    id,
  ]);
};

// 삭제
exports.deleteAsync = async (id) => {
  await db.query("DELETE FROM posts WHERE id=?", [id]);
};

// 파일 저장
exports.addFilesAsync = async (postId, files) => {
  if (!files || files.length === 0) return;
  const vals = files.map((f) => [postId, f.filename, f.originalname]);
  await db.query(
    "INSERT INTO post_files (post_id, filename, originalname) VALUES ?",
    [vals]
  );
};

// 파일 목록 조회
exports.getFilesAsync = async (postId) => {
  const [rows] = await db.query(
    "SELECT filename, originalname FROM post_files WHERE post_id = ?",
    [postId]
  );
  return rows;
};
