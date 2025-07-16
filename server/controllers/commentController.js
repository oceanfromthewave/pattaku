const commentModel = require("../models/commentModel");

exports.getComments = async (req, res) => {
  const { postId } = req.params;
  try {
    const rows = await commentModel.getByPostIdAsync(postId);
    res.json(rows);
  } catch (err) {
    console.error("댓글 목록 에러:", err); // ← 이 라인 추가!
    res.status(500).json({ error: "DB 에러" });
  }
};

exports.createComment = async (req, res) => {
  const { postId, content, parentId } = req.body;
  const user_id = req.user?.id || null;
  const author = req.user?.nickname || "익명"; // 로그인 닉네임 가져오기

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

exports.deleteComment = async (req, res) => {
  const { id } = req.params;
  try {
    await commentModel.deleteAsync(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "DB 에러" });
  }
};
