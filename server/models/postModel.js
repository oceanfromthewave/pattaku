const db = require("../config/db");

exports.db = db; // 다른 파일에서 db 접근용

exports.createAsync = async ({ user_id, title, content }) => {
  const [result] = await db.query(
    "INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)",
    [user_id, title, content]
  );
  return result;
};

exports.getAllAsync = async () => {
  const [rows] = await db.query(
    `SELECT posts.*, users.nickname AS author_nickname 
     FROM posts
     LEFT JOIN users ON posts.user_id = users.id
     ORDER BY posts.created_at DESC`
  );
  return rows;
};

// 페이지네이션이 적용된 게시글 조회
exports.getAllWithPaginationAsync = async (query, params) => {
  const [rows] = await db.query(query, params);
  return rows;
};

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

// 조회수 증가
exports.incrementViewsAsync = async (id) => {
  await db.query("UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE id = ?", [id]);
};

exports.updateAsync = async (id, title, content) => {
  await db.query("UPDATE posts SET title=?, content=? WHERE id=?", [
    title,
    content,
    id,
  ]);
};

exports.deleteAsync = async (id) => {
  await db.query("DELETE FROM posts WHERE id=?", [id]);
};

exports.addFilesAsync = async (postId, files) => {
  if (!files || files.length === 0) return;
  const vals = files.map((f) => [postId, f.filename, f.originalname]);
  await db.query(
    "INSERT INTO post_files (post_id, filename, originalname) VALUES ?",
    [vals]
  );
};

exports.getFilesAsync = async (postId) => {
  const [rows] = await db.query(
    "SELECT filename, originalname FROM post_files WHERE post_id = ?",
    [postId]
  );
  return rows;
};

exports.deleteFileAsync = async (postId, filename) => {
  await db.query("DELETE FROM post_files WHERE post_id = ? AND filename = ?", [
    postId,
    filename,
  ]);
};

// 추천/싫어요 추가
exports.addPostLike = async (postId, userId, type) => {
  await db.query(
    "INSERT INTO post_likes (user_id, post_id, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE created_at=NOW()",
    [userId, postId, type]
  );
};

// 추천/싫어요 여부 확인
exports.checkPostLike = async (postId, userId, type) => {
  const [rows] = await db.query(
    "SELECT id FROM post_likes WHERE user_id=? AND post_id=? AND type=?",
    [userId, postId, type]
  );
  return rows.length > 0;
};

// 추천/싫어요 취소 (삭제)
exports.deletePostLike = async (postId, userId, type) => {
  await db.query(
    "DELETE FROM post_likes WHERE user_id=? AND post_id=? AND type=?",
    [userId, postId, type]
  );
};

// 추천/싫어요 개수
exports.getLikeCount = async (postId, type) => {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS cnt FROM post_likes WHERE post_id=? AND type=?",
    [postId, type]
  );
  return rows[0].cnt;
};
