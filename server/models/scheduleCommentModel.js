const db = require("../config/db");

exports.list = (schedule_id, callback) => {
  db.query(
    `SELECT c.id, c.content, c.created_at, u.username AS author
     FROM schedule_comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.schedule_id = ?
     ORDER BY c.created_at ASC`,
    [schedule_id],
    callback
  );
};

exports.create = (schedule_id, user_id, content, callback) => {
  db.query(
    `INSERT INTO schedule_comments (schedule_id, user_id, content, created_at)
     VALUES (?, ?, ?, NOW())`,
    [schedule_id, user_id, content],
    callback
  );
};

exports.remove = (commentId, user_id, callback) => {
  // 작성자만 삭제 가능
  db.query(
    `DELETE FROM schedule_comments WHERE id = ? AND user_id = ?`,
    [commentId, user_id],
    (err, result) => {
      if (err) return callback(err);
      callback(null, result.affectedRows);
    }
  );
};
