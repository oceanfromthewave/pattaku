const scheduleModel = require("../models/scheduleModel");

exports.getAllSchedules = (req, res) => {
  scheduleModel.getAll((err, schedules) => {
    if (err) {
      console.error(err); // <-- 에러 로그 출력
      return res.status(500).json({ error: "일정 조회 실패" });
    }
    res.json(schedules);
  });
};

exports.createSchedule = (req, res) => {
  const { title, date, desc } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: "제목과 날짜는 필수입니다." });
  }
  scheduleModel.create({ title, date, desc }, (err, result) => {
    if (err) return res.status(500).json({ error: "일정 등록 실패" });
    res.status(201).json({ message: "일정 등록 성공", id: result.insertId });
  });
};

exports.updateSchedule = (req, res) => {
  const id = req.params.id;
  const { title, date, desc } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: "제목과 날짜는 필수입니다." });
  }
  scheduleModel.update(id, { title, date, desc }, (err) => {
    if (err) return res.status(500).json({ error: "일정 수정 실패" });
    res.json({ message: "일정 수정 성공" });
  });
};

exports.deleteSchedule = (req, res) => {
  const id = req.params.id;
  scheduleModel.delete(id, (err) => {
    if (err) return res.status(500).json({ error: "일정 삭제 실패" });
    res.json({ message: "일정 삭제 성공" });
  });
};

// 일정 상세 조회
exports.getScheduleById = (req, res) => {
  const id = req.params.id;
  // models/scheduleModel.js의 getById 사용
  require("../models/scheduleModel").getById(id, (err, schedule) => {
    if (err) return res.status(500).json({ error: "일정 조회 실패" });
    if (!schedule) return res.status(404).json({ error: "일정이 없음" });
    res.json(schedule);
  });
};
