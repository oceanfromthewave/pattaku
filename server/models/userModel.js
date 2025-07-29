const db = require("../config/db");

// 전체 유저 조회
exports.getAllAsync = async () => {
  const [rows] = await db.query(
    "SELECT id, username, email, nickname, created_at FROM users"
  );
  return rows;
};

// 회원가입
exports.createAsync = async ({ username, password, email, nickname }) => {
  const [result] = await db.query(
    "INSERT INTO users (username, password, email, nickname) VALUES (?, ?, ?, ?)",
    [username, password, email, nickname]
  );
  return result;
};

// 아이디로 유저 조회
exports.findByIdAsync = async (id) => {
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
};

// 이름으로 유저 조회
exports.findByUsernameAsync = async (username) => {
  const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  return rows[0];
};

// 이메일로 유저 조회
exports.findByEmailAsync = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

// 닉네임으로 유저 조회
exports.findByNicknameAsync = async (nickname) => {
  const [rows] = await db.query("SELECT * FROM users WHERE nickname = ?", [
    nickname,
  ]);
  return rows[0];
};

// 프로필 업데이트
exports.updateProfileAsync = async (userId, { nickname, email }) => {
  let query = "UPDATE users SET nickname = ?";
  let params = [nickname];

  if (email !== undefined) {
    query += ", email = ?";
    params.push(email);
  }

  query += " WHERE id = ?";
  params.push(userId);

  const [result] = await db.query(query, params);
  return result.affectedRows;
};

// 비밀번호 업데이트
exports.updatePasswordAsync = async (userId, hashedPassword) => {
  const [result] = await db.query(
    "UPDATE users SET password = ? WHERE id = ?",
    [hashedPassword, userId]
  );
  return result.affectedRows;
};

// 사용자 활동 통계
exports.getUserStatsAsync = async (userId) => {
  // 작성한 게시글 수
  const [postCount] = await db.query(
    "SELECT COUNT(*) as count FROM posts WHERE user_id = ?",
    [userId]
  );

  // 작성한 댓글 수
  const [commentCount] = await db.query(
    "SELECT COUNT(*) as count FROM comments WHERE user_id = ?",
    [userId]
  );

  // 받은 좋아요 수 (게시글)
  const [postLikes] = await db.query(
    `
    SELECT COUNT(*) as count 
    FROM post_likes pl 
    JOIN posts p ON pl.post_id = p.id 
    WHERE p.user_id = ? AND pl.type = 'like'
  `,
    [userId]
  );

  // 받은 좋아요 수 (댓글)
  const [commentLikes] = await db.query(
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
};
