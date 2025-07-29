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
      parentId: parentId || null,
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

// 댓글 좋아요
exports.likeComment = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user?.id;
  
  if (!user_id) return res.status(401).json({ error: "로그인 필요" });
  
  try {
    // 현재 좋아요 상태 확인
    const existedLike = await commentModel.checkLike(id, user_id, "like");
    const existedDislike = await commentModel.checkLike(id, user_id, "dislike");
    
    if (existedLike) {
      // 이미 좋아요 → 취소
      await commentModel.deleteLike(id, user_id, "like");
    } else {
      // 좋아요 추가
      await commentModel.addLike(id, user_id, "like");
      // 동시에 싫어요가 있었다면 해제
      if (existedDislike) {
        await commentModel.deleteLike(id, user_id, "dislike");
      }
    }
    
    // 최신 상태 반환
    const likes = await commentModel.getLikeCount(id, "like");
    const dislikes = await commentModel.getLikeCount(id, "dislike");
    const liked = await commentModel.checkLike(id, user_id, "like");
    const disliked = await commentModel.checkLike(id, user_id, "dislike");
    
    res.json({ liked, disliked, likes, dislikes });
  } catch (err) {
    console.error("댓글 좋아요 에러:", err);
    res.status(500).json({ error: "DB 에러" });
  }
};

// 댓글 싫어요
exports.dislikeComment = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user?.id;
  
  if (!user_id) return res.status(401).json({ error: "로그인 필요" });
  
  try {
    // 현재 싫어요 상태 확인
    const existedDislike = await commentModel.checkLike(id, user_id, "dislike");
    const existedLike = await commentModel.checkLike(id, user_id, "like");
    
    if (existedDislike) {
      // 이미 싫어요 → 취소
      await commentModel.deleteLike(id, user_id, "dislike");
    } else {
      // 싫어요 추가
      await commentModel.addLike(id, user_id, "dislike");
      // 동시에 좋아요가 있었다면 해제
      if (existedLike) {
        await commentModel.deleteLike(id, user_id, "like");
      }
    }
    
    // 최신 상태 반환
    const likes = await commentModel.getLikeCount(id, "like");
    const dislikes = await commentModel.getLikeCount(id, "dislike");
    const liked = await commentModel.checkLike(id, user_id, "like");
    const disliked = await commentModel.checkLike(id, user_id, "dislike");
    
    res.json({ liked, disliked, likes, dislikes });
  } catch (err) {
    console.error("댓글 싫어요 에러:", err);
    res.status(500).json({ error: "DB 에러" });
  }
};
