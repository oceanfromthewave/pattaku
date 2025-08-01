const scheduleVoteModel = require("../models/scheduleVoteModel");

// 투표 등록/수정
exports.voteSchedule = async (req, res) => {
  const schedule_id = req.params.scheduleId;
  const user_id = req.user.id;
  const { status } = req.body;

  if (!["attend", "absent", "pending"].includes(status)) {
    return res.status(400).json({ error: "잘못된 상태입니다." });
  }

  try {
    await scheduleVoteModel.upsertVoteAsync(schedule_id, user_id, status);
    res.json({ message: "투표 완료" });
  } catch (err) {
    res.status(500).json({ error: "투표 저장 실패" });
  }
};

// 투표 현황 조회 (닉네임, 내 상태)
exports.getVotes = async (req, res) => {
  const schedule_id = req.params.scheduleId;
  const user_id = req.user.id;
  try {
    const data = await scheduleVoteModel.getVoteStatsAsync(
      schedule_id,
      user_id
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "투표 조회 실패" });
  }
};