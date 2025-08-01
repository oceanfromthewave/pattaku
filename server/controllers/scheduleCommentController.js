const scheduleCommentModel = require("../models/scheduleCommentModel");

// 댓글 목록 조회
exports.list = async (req, res) => {
  const schedule_id = req.params.scheduleId;
  const user_id = req.user?.id || null;

  try {
    const comments = await scheduleCommentModel.listAsync(schedule_id, user_id);

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      parent_id: comment.parent_id,
      user_id: comment.user_id,
      author: comment.author,
      author_nickname: comment.author_nickname,
      likes: comment.likes,
      dislikes: comment.dislikes,
      isLiked: Boolean(comment.isLiked),
      isDisliked: Boolean(comment.isDisliked),
    }));

    res.json(formattedComments);
  } catch (error) {
    console.error("댓글 목록 조회 오류:", error);
    res.status(500).json({
      error: "댓글을 불러오는데 실패했습니다.",
    });
  }
};

// 댓글 등록
exports.create = async (req, res) => {
  const schedule_id = req.params.scheduleId;
  const user_id = req.user.id;
  const { content, parentId } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: "댓글 내용을 입력해주세요." });
  }

  try {
    const commentId = await scheduleCommentModel.createAsync(
      schedule_id,
      user_id,
      content.trim(),
      parentId || null
    );

    res.status(201).json({
      message: "댓글이 등록되었습니다.",
      id: commentId,
    });
  } catch (error) {
    console.error("댓글 등록 오류:", error);
    res.status(500).json({
      error: "댓글 등록에 실패했습니다.",
    });
  }
};

// 댓글 삭제
exports.remove = async (req, res) => {
  const commentId = req.params.commentId;
  const user_id = req.user.id;

  try {
    const comment = await scheduleCommentModel.findByIdAsync(commentId);
    if (!comment) {
      return res.status(404).json({ error: "존재하지 않는 댓글입니다." });
    }

    if (comment.user_id !== user_id) {
      return res.status(403).json({ error: "댓글을 삭제할 권한이 없습니다." });
    }

    const affected = await scheduleCommentModel.removeAsync(commentId, user_id);

    if (affected === 0) {
      return res.status(403).json({ error: "댓글을 삭제할 권한이 없습니다." });
    }

    res.json({ message: "댓글이 삭제되었습니다." });
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    res.status(500).json({
      error: "댓글 삭제에 실패했습니다.",
    });
  }
};

// 댓글 좋아요
exports.like = async (req, res) => {
  const { commentId } = req.params;
  const user_id = req.user?.id;
  
  if (!user_id) return res.status(401).json({ error: "로그인 필요" });
  
  try {
    const result = await scheduleCommentModel.toggleVoteAsync(commentId, user_id, 'like');
    
    res.json({ 
      message: "좋아요가 반영되었습니다.",
      likeCount: result.likeCount,
      dislikeCount: result.dislikeCount,
      isLiked: result.userVote === 'like',
      isDisliked: result.userVote === 'dislike'
    });
  } catch (err) {
    console.error("스케줄 댓글 좋아요 에러:", err);
    res.status(500).json({ error: "DB 에러" });
  }
};

// 댓글 싫어요
exports.dislike = async (req, res) => {
  const { commentId } = req.params;
  const user_id = req.user?.id;
  
  if (!user_id) return res.status(401).json({ error: "로그인 필요" });
  
  try {
    const result = await scheduleCommentModel.toggleVoteAsync(commentId, user_id, 'dislike');
    
    res.json({ 
      message: "싫어요가 반영되었습니다.",
      likeCount: result.likeCount,
      dislikeCount: result.dislikeCount,
      isLiked: result.userVote === 'like',
      isDisliked: result.userVote === 'dislike'
    });
  } catch (err) {
    console.error("스케줄 댓글 싫어요 에러:", err);
    res.status(500).json({ error: "DB 에러" });
  }
};

exports.update = async (req, res) => {
  const commentId = req.params.commentId;
  const user_id = req.user.id;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: "수정할 내용을 입력해주세요." });
  }

  try {
    const comment = await scheduleCommentModel.findByIdAsync(commentId);
    if (!comment) {
      return res.status(404).json({ error: "존재하지 않는 댓글입니다." });
    }

    if (comment.user_id !== user_id) {
      return res.status(403).json({ error: "댓글을 수정할 권한이 없습니다." });
    }

    const affected = await scheduleCommentModel.updateAsync(
      commentId,
      user_id,
      content.trim()
    );
    if (affected === 0) {
      return res.status(403).json({ error: "댓글을 수정할 권한이 없습니다." });
    }

    res.json({ message: "댓글이 수정되었습니다." });
  } catch (error) {
    console.error("댓글 수정 오류:", error);
    res.status(500).json({ error: "댓글 수정에 실패했습니다." });
  }
};