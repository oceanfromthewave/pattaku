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
