import { useEffect, useState, useRef } from "react";
import { notifySuccess, notifyError } from "../../utils/notify";
import imageCompression from "browser-image-compression";
import classNames from "classnames";
import styles from "../../styles/ScheduleCommentList.module.scss";
import { formatDate } from "../../utils/data";

// 좋아요/싫어요 상수
const VOTE = { LIKE: "like", DISLIKE: "dislike" };

export default function ScheduleCommentList({ scheduleId, isLogin, currentUser }) {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [replyInput, setReplyInput] = useState({});
  const [replyFile, setReplyFile] = useState({});
  const [parentId, setParentId] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [likeStates, setLikeStates] = useState({});
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const fileInputRef = useRef();

  // 댓글 불러오기
  useEffect(() => {
    setLoading(true);
    fetch(`/api/schedules/${scheduleId}/comments`)
      .then(res => res.json())
      .then(data => {
        setComments(data);
        const obj = {};
        data.forEach(c => {
          obj[c.id] = {
            likeCount: c.likes || 0,
            dislikeCount: c.dislikes || 0,
            liked: c.isLiked || false,
            disliked: c.isDisliked || false,
          };
        });
        setLikeStates(obj);
      })
      .finally(() => setLoading(false));
  }, [scheduleId, refresh]);

  // 파일 압축/리사이즈
  const compressFile = async (file) => {
    if (!file) return null;
    if (file.type?.startsWith("image/")) {
      try {
        return await imageCompression(file, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
      } catch {
        return file;
      }
    }
    return file;
  };

  // 댓글 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return;
    setLoading(true);
    try {
      let fileData = null;
      if (file) fileData = await compressFile(file);

      const formData = new FormData();
      formData.append("content", input);
      formData.append("parentId", "");
      if (fileData) formData.append("file", fileData);

      await authFetch(`/api/schedules/${scheduleId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setInput("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      notifySuccess("댓글이 등록되었습니다.");
      setRefresh(r => r + 1);
    } catch {
      notifyError("댓글 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 답글 등록
  const handleReplySubmit = async (parent) => {
    if (!replyInput[parent] && !replyFile[parent]) return;
    setLoading(true);
    try {
      let fileData = null;
      if (replyFile[parent]) fileData = await compressFile(replyFile[parent]);

      const formData = new FormData();
      formData.append("content", replyInput[parent] || "");
      formData.append("parentId", parent);
      if (fileData) formData.append("file", fileData);

      await authFetch(`/api/schedules/${scheduleId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setReplyInput(prev => ({ ...prev, [parent]: "" }));
      setReplyFile(prev => ({ ...prev, [parent]: null }));
      notifySuccess("답글이 등록되었습니다.");
      setParentId(null);
      setRefresh(r => r + 1);
    } catch {
      notifyError("답글 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 삭제
  const handleDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    setLoading(true);
    try {
      await authFetch(`/api/schedules/${scheduleId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      notifySuccess("삭제되었습니다.");
      setRefresh(r => r + 1);
    } catch {
      notifyError("삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 좋아요/싫어요
  const handleVote = async (commentId, type) => {
    if (!token) {
      notifyError("로그인 후 가능합니다.");
      return;
    }
    try {
      const res = await authFetch(`/api/schedules/${scheduleId}/comments/${commentId}/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setLikeStates(prev => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          [`${type}Count`]: prev[commentId][`${type}d`]
            ? prev[commentId][`${type}Count`] - 1
            : prev[commentId][`${type}Count`] + 1,
          liked: type === VOTE.LIKE ? !prev[commentId].liked : prev[commentId].liked,
          disliked: type === VOTE.DISLIKE ? !prev[commentId].disliked : prev[commentId].disliked,
        }
      }));
    } catch {
      notifyError('추천 처리 실패');
    }
  };

  // 미리보기
  const renderFilePreview = (file) => {
    if (!file) return null;
    if (file.type?.startsWith('image/')) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt="첨부이미지"
          className={styles.previewImg}
          onLoad={e => URL.revokeObjectURL(e.target.src)}
        />
      );
    }
    return <div className={styles.previewFile}>{file.name}</div>;
  };
  // 첨부파일(이미 업로드된 것) 출력
  const renderAttachment = (comment) => {
    if (!comment.file_url) return null;
    const isImage = comment.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    if (isImage) {
      return <img src={comment.file_url} alt="첨부" className={styles.commentImg} />;
    }
    return (
      <a href={comment.file_url} download className={styles.commentFileLink}>
        첨부파일: {comment.file_name || '다운로드'}
      </a>
    );
  };

  const rootComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);
  const getReplies = (parentId) => replies.filter(r => r.parent_id === parentId);

  return (
    <div className={classNames(styles["comment-list-wrap"], "comment-list-wrap")}>
      <h3>일정 댓글</h3>
      {isLogin ? (
        <form className={styles["comment-form"]} onSubmit={handleSubmit}>
  <textarea
    placeholder="댓글을 입력하세요"
    value={input}
    onChange={e => setInput(e.target.value)}
    rows={2}
    className={styles.textarea}
    maxLength={400}
    disabled={loading}
  />
  <button type="submit" className={styles.button} disabled={loading}>등록</button>
</form>
      ) : (
        <div className={styles["comment-login-ask"]}>로그인 후 댓글 작성 가능</div>
      )}
      <ul className={styles["comment-list"]}>
        {rootComments.map(comment => (
          <li key={comment.id} className={styles["comment-item"]}>
            <div className={styles["comment-head"]}>
              <b>{comment.author_nickname || comment.author}</b>
              <span className={styles["comment-date"]}>{formatDate(comment.created_at)}</span>
              <button
                className={classNames(
                  styles['comment-like-btn'],
                  { [styles['liked']]: likeStates[comment.id]?.liked }
                )}
                onClick={() => handleVote(comment.id, VOTE.LIKE)}
                type="button"
                aria-label="좋아요"
                disabled={loading}
              >
                👍 {likeStates[comment.id]?.likeCount || 0}
              </button>
              <button
                className={classNames(
                  styles['comment-dislike-btn'],
                  { [styles['disliked']]: likeStates[comment.id]?.disliked }
                )}
                onClick={() => handleVote(comment.id, VOTE.DISLIKE)}
                type="button"
                aria-label="싫어요"
                disabled={loading}
              >
                👎 {likeStates[comment.id]?.dislikeCount || 0}
              </button>
              {isLogin && comment.author === currentUser && (
                <button className={styles["comment-del"]} onClick={() => handleDelete(comment.id)}>삭제</button>
              )}
              {isLogin && (
                <button
                  className={styles["comment-reply-btn"]}
                  onClick={() => setParentId(parentId === comment.id ? null : comment.id)}
                >
                  {parentId === comment.id ? "취소" : "답글"}
                </button>
              )}
            </div>
            <div className={styles["comment-content"]}>
              {comment.content}
              {renderAttachment(comment)}
            </div>
            {parentId === comment.id && (
              <div className={styles["comment-reply-form"]}>
                <textarea
                  placeholder="답글을 입력하세요"
                  value={replyInput[comment.id] || ""}
                  onChange={e => setReplyInput(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  rows={2}
                  className={styles.textarea}
                  maxLength={400}
                  disabled={loading}
                />
                {renderFilePreview(replyFile[comment.id])}
                <button
                  className={styles.button}
                  onClick={() => handleReplySubmit(comment.id)}
                  type="button"
                  disabled={loading}
                >
                  등록
                </button>
              </div>
            )}
            <ul className={styles["comment-replies"]}>
              {getReplies(comment.id).map(reply => (
                <li key={reply.id} className={classNames(styles["comment-item"], styles["comment-reply"])}>
                  <div className={styles["comment-head"]}>
                    <b>{reply.author_nickname || reply.author}</b>
                    <span className={styles["comment-date"]}>{formatDate(comment.created_at)}</span>
                    <button
                      className={classNames(
                        styles['comment-like-btn'],
                        { [styles['liked']]: likeStates[reply.id]?.liked }
                      )}
                      onClick={() => handleVote(reply.id, VOTE.LIKE)}
                      type="button"
                      aria-label="좋아요"
                      disabled={loading}
                    >
                      👍 {likeStates[reply.id]?.likeCount || 0}
                    </button>
                    <button
                      className={classNames(
                        styles['comment-dislike-btn'],
                        { [styles['disliked']]: likeStates[reply.id]?.disliked }
                      )}
                      onClick={() => handleVote(reply.id, VOTE.DISLIKE)}
                      type="button"
                      aria-label="싫어요"
                      disabled={loading}
                    >
                      👎 {likeStates[reply.id]?.dislikeCount || 0}
                    </button>
                    {isLogin && reply.author === currentUser && (
                      <button className={styles["comment-del"]} onClick={() => handleDelete(reply.id)}>삭제</button>
                    )}
                  </div>
                  <div className={styles["comment-content"]}>
                    {reply.content}
                    {renderAttachment(reply)}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
