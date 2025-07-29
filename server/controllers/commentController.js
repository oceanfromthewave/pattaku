const commentModel = require("../models/commentModel");
const postModel = require("../models/postModel"); // 게시글 모델 추가
const NotificationService = require("../notificationService"); // NotificationService 추가

let notificationService; // notificationService 인스턴스를 저장할 변수

// 미들웨어에서 req.app.get('socketHandler')를 통해 socketHandler를 주입받아 NotificationService 인스턴스 생성
// 이 함수는 컨트롤러의 각 라우트 핸들러가 실행되기 전에 호출되어야 합니다.
exports.initNotificationService = (req, res, next) => {
  if (!notificationService) {
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      notificationService = new NotificationService(socketHandler);
    } else {
      console.warn("SocketHandler not found on app. NotificationService will not send real-time notifications.");
    }
  }
  next();
};

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
    const newCommentId = await commentModel.createAsync({
      postId,
      parentId: parentId || null,
      user_id,
      author,
      content,
    });

    // 게시글 소유자에게 알림 전송
    if (notificationService) {
      const post = await postModel.getPostById(postId); // 게시글 정보 가져오기
      if (post && post.user_id !== user_id) { // 자신의 게시글에 댓글 다는 경우 제외
        await notificationService.createCommentNotification(
          post.user_id, 
          user_id, 
          postId, 
          post.title, 
          author
        );
      }

      // 답글인 경우, 부모 댓글 작성자에게 알림 전송
      if (parentId) {
        const parentComment = await commentModel.findByIdAsync(parentId);
        if (parentComment && parentComment.user_id !== user_id) { // 자신의 댓글에 답글 다는 경우 제외
          await notificationService.createReplyNotification(
            parentComment.user_id, 
            user_id, 
            postId, 
            parentId, 
            post.title, 
            author
          );
        }
      }
    }

    res.json({ success: true, commentId: newCommentId });
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
    const result = await commentModel.toggleVoteAsync(id, user_id, 'like');
    
    // 좋아요 알림 전송
    if (notificationService && result.userVote === 'like') { // 좋아요가 성공적으로 적용되었을 때만 알림
      const comment = await commentModel.findByIdAsync(id); // 댓글 정보 가져오기
      if (comment && comment.user_id !== user_id) { // 자신의 댓글에 좋아요 누르는 경우 제외
        const post = await postModel.getPostById(comment.postId); // 게시글 정보 가져오기
        await notificationService.createLikeNotification(
          comment.user_id, 
          user_id, 
          comment.postId, 
          comment.id, 
          'comment', 
          post ? post.title : '알 수 없는 게시글', // 게시글 제목 전달
          req.user?.nickname || "익명"
        );
      }
    }

    res.json({ 
      liked: result.userVote === 'like',
      disliked: result.userVote === 'dislike',
      likes: result.likeCount,
      dislikes: result.dislikeCount
    });
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
    const result = await commentModel.toggleVoteAsync(id, user_id, 'dislike');
    
    res.json({ 
      liked: result.userVote === 'like',
      disliked: result.userVote === 'dislike',
      likes: result.likeCount,
      dislikes: result.dislikeCount
    });
  } catch (err) {
    console.error("댓글 싫어요 에러:", err);
    res.status(500).json({ error: "DB 에러" });
  }
};
