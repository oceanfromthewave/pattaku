const db = require("../config/db");

// upsert (있으면 update, 없으면 insert)
exports.upsertVote = (schedule_id, user_id, status, callback) => {
  db.query(
    `INSERT INTO schedule_votes (schedule_id, user_id, status)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
    [schedule_id, user_id, status],
    callback
  );
};

exports.getVoteStats = (schedule_id, user_id, callback) => {
  // 전체 투표 현황 + 닉네임까지
  const sql = `
    SELECT v.status, COUNT(*) as count, GROUP_CONCAT(u.nickname) as nicknames
    FROM schedule_votes v
    LEFT JOIN users u ON v.user_id = u.id
    WHERE v.schedule_id = ?
    GROUP BY v.status
  `;
  // 내 상태도 함께 조회
  db.query(sql, [schedule_id], (err, rows) => {
    if (err) return callback(err);
    // 각 상태별 닉네임 리스트 배열로 변환
    const stats = [
      { status: "attend", count: 0, nicknames: [] },
      { status: "absent", count: 0, nicknames: [] },
      { status: "pending", count: 0, nicknames: [] },
    ];
    rows.forEach((r) => {
      const target = stats.find((s) => s.status === r.status);
      if (target) {
        target.count = r.count;
        target.nicknames = r.nicknames ? r.nicknames.split(",") : [];
      }
    });

    // 내 상태도 함께 조회
    db.query(
      `SELECT status FROM schedule_votes WHERE schedule_id = ? AND user_id = ?`,
      [schedule_id, user_id],
      (err2, [me]) => {
        if (err2) return callback(err2);
        callback(null, {
          stats, // [{status:'attend', count:2, nicknames:['닉1','닉2']}, ...]
          myStatus: me ? me.status : null,
        });
      }
    );
  });
};
