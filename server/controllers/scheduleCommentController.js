const scheduleCommentModel = require("../models/scheduleCommentModel");

// 목록
exports.list = async (req, res) => {
  const schedule_id = req.params.id;
  try {
    const rows = await scheduleCommentModel.listAsync(schedule_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "댓글 조회 실패" });
  }
};

// 등록 (대댓글 지원)
exports.create = async (req, res) => {
  const schedule_id = req.params.id;
  const user_id = req.user.id;
  const { content, parentId } = req.body;
  if (!content) return res.status(400).json({ error: "내용을 입력하세요" });
  try {
    await scheduleCommentModel.createAsync(
      schedule_id,
      user_id,
      content,
      parentId || null
    );
    res.json({ message: "등록됨" });
  } catch (err) {
    res.status(500).json({ error: "댓글 등록 실패" });
  }
};

// 삭제 (본인만)
exports.remove = async (req, res) => {
  const commentId = req.params.commentId;
  const user_id = req.user.id;
  try {
    // 권한 체크 (불필요시 제거 가능)
    const comment = await scheduleCommentModel.findByIdAsync(commentId);
    if (!comment) return res.status(404).json({ error: "댓글 없음" });
    if (comment.user_id !== user_id)
      return res.status(403).json({ error: "권한 없음" });

    const affected = await scheduleCommentModel.removeAsync(commentId, user_id);
    if (!affected) return res.status(403).json({ error: "권한 없음" });
    res.json({ message: "삭제됨" });
  } catch (err) {
    res.status(500).json({ error: "댓글 삭제 실패" });
  }
};

exports.like = async (req, res) => {
  // schedule_id: req.params.id, comment_id: req.params.commentId, user_id: req.user.id
  // 1. 중복 허용 안하려면 comment_likes 테이블 필요 (user_id, comment_id, type: like/dislike)
  // 2. insert 또는 toggle 처리, 이미 있으면 삭제, 없으면 추가 등
  // 3. 최종 like/dislike count 반환
  // 기본 구현 예시 (추가 설명 가능)
  res.json({ ok: true });
};

exports.dislike = async (req, res) => {
  // 나중에 실제로 DB 처리 넣어도 되고, 일단 기본 응답만~
  res.json({ ok: true });
};
