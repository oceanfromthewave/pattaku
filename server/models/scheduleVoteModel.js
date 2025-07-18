const db = require("../config/db");

// upsert (있으면 update, 없으면 insert)
exports.upsertVoteAsync = async (schedule_id, user_id, status) => {
  await db.query(
    `INSERT INTO schedule_votes (schedule_id, user_id, status)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
    [schedule_id, user_id, status]
  );
};

exports.getVoteStatsAsync = async (schedule_id, user_id) => {
  // 전체 투표 현황 + 닉네임
  const [rows] = await db.query(
    `SELECT v.status, COUNT(*) as count, GROUP_CONCAT(u.nickname) as nicknames
     FROM schedule_votes v
     LEFT JOIN users u ON v.user_id = u.id
     WHERE v.schedule_id = ?
     GROUP BY v.status`,
    [schedule_id]
  );
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

  // 내 상태
  const [[me]] = await db.query(
    `SELECT status FROM schedule_votes WHERE schedule_id = ? AND user_id = ?`,
    [schedule_id, user_id]
  );
  return {
    stats,
    myStatus: me ? me.status : null,
  };
};
