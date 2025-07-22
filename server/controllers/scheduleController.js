const scheduleModel = require("../models/scheduleModel");
const path = require("path");

// 전체 조회
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await scheduleModel.getAllAsync();
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "일정 조회 실패" });
  }
};

// 상세 조회 (작성자, 이미지)
exports.getScheduleDetail = async (req, res) => {
  try {
    const schedule = await scheduleModel.getByIdAsync(req.params.id);
    if (!schedule) return res.status(404).json({ error: "일정이 없음" });
    res.json(schedule); // images는 모델에서 자동 포함
  } catch (err) {
    res.status(500).json({ error: "일정 조회 실패" });
  }
};

// 일정 등록 + 이미지(여러장)
exports.createScheduleWithImages = async (req, res) => {
  const { title, date, desc } = req.body;
  const user_id = req.user.id;
  if (!title || !date) {
    return res.status(400).json({ error: "제목과 날짜는 필수입니다." });
  }
  // 업로드된 이미지 파일 URL 배열 추출 (확장자까지)
  const imageUrls = (req.files || []).map(
    (file) => `/uploads/${path.basename(file.path)}`
  );
  try {
    const id = await scheduleModel.createAsync({
      user_id,
      title,
      date,
      desc,
      imageUrls,
    });
    res.status(201).json({ message: "일정 등록 성공", id });
  } catch (err) {
    res.status(500).json({ error: "일정 등록 실패" });
  }
};

// 일정 수정 (권한: 본인만)
exports.updateSchedule = async (req, res) => {
  const id = req.params.id;
  const user_id = req.user.id;
  const { title, date, desc } = req.body;
  if (!title || !date)
    return res.status(400).json({ error: "제목과 날짜는 필수입니다." });
  // 권한 체크
  const owner = await scheduleModel.getOwnerAsync(id);
  if (!owner) return res.status(404).json({ error: "일정이 없음" });
  if (owner !== user_id)
    return res.status(403).json({ error: "수정 권한 없음" });

  try {
    await scheduleModel.updateAsync(id, { title, date, desc });
    res.json({ message: "일정 수정 성공" });
  } catch (err) {
    res.status(500).json({ error: "일정 수정 실패" });
  }
};

// 일정 삭제 (권한: 본인만)
exports.deleteSchedule = async (req, res) => {
  const id = req.params.id;
  const user_id = req.user.id;
  // 권한 체크
  const owner = await scheduleModel.getOwnerAsync(id);
  if (!owner) return res.status(404).json({ error: "일정이 없음" });
  if (owner !== user_id)
    return res.status(403).json({ error: "삭제 권한 없음" });

  try {
    await scheduleModel.deleteAsync(id);
    res.json({ message: "일정 삭제 성공" });
  } catch (err) {
    res.status(500).json({ error: "일정 삭제 실패" });
  }
};
