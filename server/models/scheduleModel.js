// models/scheduleModel.js
const db = require("../config/db");

// 전체 일정 조회(작성자 닉네임 포함)
exports.getAllAsync = async () => {
  const [rows] = await db.query(
    `SELECT s.*, u.nickname AS author_nickname
     FROM schedules s
     LEFT JOIN users u ON s.user_id = u.id
     ORDER BY s.date ASC`
  );
  return rows;
};

// 상세 조회 (이미지, 작성자 포함)
exports.getByIdAsync = async (id) => {
  const [rows] = await db.query(
    `SELECT s.*, u.nickname AS author_nickname
     FROM schedules s
     LEFT JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`,
    [id]
  );
  const schedule = rows[0];
  if (!schedule) return null;
  // 이미지 배열 (컬럼명 꼭 image_url!!)
  const [imgs] = await db.query(
    `SELECT image_url FROM schedule_images WHERE schedule_id = ?`,
    [id]
  );
  schedule.images = imgs.map((i) => i.image_url);
  return schedule;
};

// 등록 (이미지 경로 배열 저장)
exports.createAsync = async ({ user_id, title, date, desc, imageUrls }) => {
  const [result] = await db.query(
    "INSERT INTO schedules (user_id, title, date, `desc`) VALUES (?, ?, ?, ?)",
    [user_id, title, date, desc]
  );
  const scheduleId = result.insertId;
  if (imageUrls && imageUrls.length > 0) {
    await db.query(
      "INSERT INTO schedule_images (schedule_id, image_url) VALUES ?",
      [imageUrls.map((image_url) => [scheduleId, image_url])]
    );
  }
  return scheduleId;
};

// 수정 (권한: user_id 체크 필요)
exports.updateAsync = async (id, { title, date, desc }) => {
  await db.query(
    "UPDATE schedules SET title = ?, date = ?, `desc` = ? WHERE id = ?",
    [title, date, desc, id]
  );
};

// 삭제 (이미지까지 삭제)
exports.deleteAsync = async (id) => {
  await db.query("DELETE FROM schedule_images WHERE schedule_id = ?", [id]);
  await db.query("DELETE FROM schedules WHERE id = ?", [id]);
};

// 일정 소유자 확인(권한)
exports.getOwnerAsync = async (id) => {
  const [rows] = await db.query("SELECT user_id FROM schedules WHERE id = ?", [
    id,
  ]);
  return rows[0]?.user_id;
};
