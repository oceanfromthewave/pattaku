const db = require("../config/db");

// 전체 일정 조회
exports.getAll = (callback) => {
  db.query("SELECT * FROM schedules ORDER BY date ASC", (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
};

// 일정 등록
exports.create = ({ title, date, desc }, callback) => {
  db.query(
    "INSERT INTO schedules (title, date, `desc`) VALUES (?, ?, ?)",
    [title, date, desc],
    (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    }
  );
};

// 일정 수정
exports.update = (id, { title, date, desc }, callback) => {
  db.query(
    "UPDATE schedules SET title = ?, date = ?, `desc` = ? WHERE id = ?",
    [title, date, desc, id],
    (err) => {
      if (err) return callback(err);
      callback(null);
    }
  );
};

// 일정 삭제
exports.delete = (id, callback) => {
  db.query("DELETE FROM schedules WHERE id = ?", [id], (err) => {
    if (err) return callback(err);
    callback(null);
  });
};
