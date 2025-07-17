const scheduleVoteModel = require("../models/scheduleVoteModel");

exports.voteSchedule = (req, res) => {
  const schedule_id = req.params.id;
  const user_id = req.user.id; // 토큰에서 추출
  const { status } = req.body;

  if (!["attend", "absent", "pending"].includes(status)) {
    return res.status(400).json({ error: "잘못된 상태입니다." });
  }

  scheduleVoteModel.upsertVote(schedule_id, user_id, status, (err) => {
    if (err) return res.status(500).json({ error: "투표 저장 실패" });
    res.json({ message: "투표 완료" });
  });
};

exports.getVotes = (req, res) => {
  const schedule_id = req.params.id;
  const user_id = req.user.id;
  scheduleVoteModel.getVoteStats(schedule_id, user_id, (err, data) => {
    if (err) return res.status(500).json({ error: "투표 조회 실패" });
    res.json(data);
  });
};
