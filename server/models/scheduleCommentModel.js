const db = require("../config/db");

// 목록 (대댓글/닉네임/유저ID)
exports.listAsync = async (schedule_id) => {
  const [rows] = await db.query(
    `SELECT c.id, c.content, c.created_at, c.parent_id, c.user_id, 
            u.nickname AS author_nickname, u.username AS author
     FROM schedule_comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.schedule_id = ?
     ORDER BY c.created_at ASC`,
    [schedule_id]
  );
  return rows;
};

// 등록 (대댓글 지원)
exports.createAsync = async (
  schedule_id,
  user_id,
  content,
  parent_id = null
) => {
  await db.query(
    `INSERT INTO schedule_comments (schedule_id, user_id, content, parent_id, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [schedule_id, user_id, content, parent_id]
  );
};

// 삭제 (본인만)
exports.removeAsync = async (commentId, user_id) => {
  const [result] = await db.query(
    `DELETE FROM schedule_comments WHERE id = ? AND user_id = ?`,
    [commentId, user_id]
  );
  return result.affectedRows;
};

// 상세 조회 (삭제 권한 체크용)
exports.findByIdAsync = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM schedule_comments WHERE id = ?",
    [id]
  );
  return rows[0];
};

// scheduleCommentController.js
exports.create = async (req, res) => {
  const schedule_id = req.params.id;
  const user_id = req.user.id;
  const { content, parentId } = req.body;
  let file_url = null,
    file_name = null;
  if (req.file) {
    file_url = `/uploads/${req.file.filename}`;
    file_name = req.file.originalname;
  }
  // createAsync에 file_url, file_name 전달 (모델도 수정!)
  try {
    await scheduleCommentModel.createAsync(
      schedule_id,
      user_id,
      content,
      parentId || null,
      file_url,
      file_name
    );
    res.json({ message: "등록됨" });
  } catch (err) {
    res.status(500).json({ error: "댓글 등록 실패" });
  }
};
