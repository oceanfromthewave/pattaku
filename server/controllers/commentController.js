const commentModel = require("../models/commentModel");

// 댓글 조회
exports.getComments = async (req, res) => {
  const { postId } = req.params;
  try {
    const rows = await commentModel.getByPostIdAsync(postId);
    res.json(rows);
  } catch (err) {
    console.error("댓글 목록 에러:", err);
    res.status(500).json({ error: "DB 에러" });
  }
};

// 댓글 등록
exports.createComment = async (req, res) => {
  const { postId, content, parentId } = req.body;
  const user_id = req.user?.id || null;
  const author = req.user?.nickname || "익명";

  if (!postId || !content || !user_id) {
    return res.status(400).json({ error: "내용 누락/로그인 필요" });
  }

  try {
    await commentModel.createAsync({
      postId,
      parentId,
      user_id,
      author,
      content,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("댓글 등록 에러:", err);
    res.status(500).json({ error: "DB 에러" });
  }
};

// 댓글 삭제(본인만 가능)
exports.deleteComment = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user?.id;
  if (!user_id) return res.status(401).json({ error: "로그인 필요" });

  try {
    // 댓글 소유권 확인 (권한 체크)
    const comment = await commentModel.findByIdAsync(id);
    if (!comment) return res.status(404).json({ error: "댓글 없음" });
    if (comment.user_id !== user_id)
      return res.status(403).json({ error: "삭제 권한 없음" });

    await commentModel.deleteAsync(id);
    res.json({ success: true });
  } catch (err) {
    console.error("댓글 삭제 에러:", err);
    res.status(500).json({ error: "DB 에러" });
  }
};

exports.updateComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const user_id = req.user?.id;
  if (!user_id) return res.status(401).json({ error: "로그인 필요" });
  try {
    const comment = await commentModel.findByIdAsync(id);
    if (!comment) return res.status(404).json({ error: "댓글 없음" });
    if (comment.user_id !== user_id)
      return res.status(403).json({ error: "수정 권한 없음" });
    await commentModel.updateAsync(id, content);
    res.json({ success: true });
  } catch (err) {
    console.error("댓글 수정 에러:", err);
    res.status(500).json({ error: "DB 에러" });
  }
};
