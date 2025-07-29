const scheduleModel = require("../models/scheduleModel");
const path = require("path");

// 전체 조회 (페이지네이션 및 검색 지원)
exports.getSchedules = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8; // 스케줄은 8개씩
    const offset = (page - 1) * limit;
    const { search, sort } = req.query;

    // 검색 조건 구성
    let whereClause = "WHERE 1=1";
    let queryParams = [];
    
    if (search) {
      whereClause += " AND (s.title LIKE ? OR s.desc LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // 정렬 조건
    let orderClause = "ORDER BY s.created_at DESC";
    if (sort === 'old') {
      orderClause = "ORDER BY s.created_at ASC";
    }

    // 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM schedules s
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
    `;
    const countResult = await scheduleModel.getAllWithPaginationAsync(countQuery, queryParams);
    const total = countResult[0].total;

    // 스케줄 목록 조회 (이미지 및 투표 수 포함)
    const schedulesQuery = `
      SELECT 
        s.*,
        u.username as author,
        u.nickname as author_nickname,
        COALESCE(vote_counts.vote_count, 0) as vote_count
      FROM schedules s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN (
        SELECT schedule_id, COUNT(*) as vote_count
        FROM schedule_votes 
        GROUP BY schedule_id
      ) vote_counts ON s.id = vote_counts.schedule_id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    
    const schedules = await scheduleModel.getAllWithPaginationAsync(
      schedulesQuery, 
      [...queryParams, limit, offset]
    );
    
    // 각 스케줄에 이미지 추가
    for (const schedule of schedules) {
      schedule.images = await scheduleModel.getImagesAsync(schedule.id);
    }
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      schedules,
      currentPage: page,
      totalPages,
      total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });
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
