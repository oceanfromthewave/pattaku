const scheduleCommentModel = require("../models/scheduleCommentModel");

// 일정 댓글 목록 조회
exports.list = (req, res) => {
  const schedule_id = req.params.id;
  scheduleCommentModel.list(schedule_id, (err, rows) => {
    if (err) return res.status(500).json({ error: "댓글 조회 실패" });
    res.json(rows);
  });
};

// 일정 댓글 등록
exports.create = (req, res) => {
  const schedule_id = req.params.id;
  const user_id = req.user.id;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "내용을 입력하세요" });
  scheduleCommentModel.create(schedule_id, user_id, content, (err) => {
    if (err) return res.status(500).json({ error: "댓글 등록 실패" });
    res.json({ message: "등록됨" });
  });
};

// 일정 댓글 삭제 (작성자만)
exports.remove = (req, res) => {
  const commentId = req.params.commentId;
  const user_id = req.user.id;
  scheduleCommentModel.remove(commentId, user_id, (err, affected) => {
    if (err) return res.status(500).json({ error: "댓글 삭제 실패" });
    if (!affected) return res.status(403).json({ error: "권한 없음" });
    res.json({ message: "삭제됨" });
  });
};
