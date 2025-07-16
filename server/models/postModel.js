const db = require("../config/db");

exports.createAsync = async ({ user_id, title, content }) => {
  const [result] = await db
    .promise()
    .query("INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)", [
      user_id,
      title,
      content,
    ]);
  return result;
};

exports.getAllAsync = async () => {
  const [rows] = await db.promise().query(
    `SELECT posts.*, users.nickname AS author FROM posts
     LEFT JOIN users ON posts.user_id = users.id
     ORDER BY posts.created_at DESC`
  );
  return rows;
};

exports.getByIdAsync = async (id) => {
  const [rows] = await db.promise().query(
    `SELECT posts.*, users.nickname AS author FROM posts
     LEFT JOIN users ON posts.user_id = users.id
     WHERE posts.id = ?`,
    [id]
  );
  return rows[0];
};

exports.updateAsync = async (id, title, content) => {
  await db
    .promise()
    .query("UPDATE posts SET title=?, content=? WHERE id=?", [
      title,
      content,
      id,
    ]);
};

exports.deleteAsync = async (id) => {
  await db.promise().query("DELETE FROM posts WHERE id=?", [id]);
};
