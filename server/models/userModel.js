const db = require("../config/db");

// 전체 유저 조회
exports.getAllAsync = async () => {
  const [rows] = await db
    .promise()
    .query("SELECT id, username, email, nickname, created_at FROM users");
  return rows;
};

// 회원가입
exports.createAsync = async ({ username, password, email, nickname }) => {
  const [result] = await db
    .promise()
    .query(
      "INSERT INTO users (username, password, email, nickname) VALUES (?, ?, ?, ?)",
      [username, password, email, nickname]
    );
  return result;
};

// 아이디로 유저 조회
exports.findByUsernameAsync = async (username) => {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM users WHERE username = ?", [username]);
  return rows[0];
};
