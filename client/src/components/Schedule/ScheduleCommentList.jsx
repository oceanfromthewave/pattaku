import { useEffect, useState } from "react";
import { notifySuccess, notifyError } from "../../utils/notify";
import styles from "../../styles/ScheduleCommentList.module.scss";

export default function ScheduleCommentList({ scheduleId, isLogin, currentUser }) {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [replyInput, setReplyInput] = useState({});
  const [parentId, setParentId] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const token = localStorage.getItem("token");

  // 댓글 불러오기
  useEffect(() => {
    fetch(`/api/schedules/${scheduleId}/comments`)
      .then(res => res.json())
      .then(setComments);
  }, [scheduleId, refresh]);

  // 댓글 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      const res = await fetch(`/api/schedules/${scheduleId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: input, parentId: null }),
      });
      if (!res.ok) throw new Error("댓글 등록 실패");
      setInput("");
      notifySuccess("댓글이 등록되었습니다.");
      setRefresh(r => r + 1);
    } catch {
      notifyError("댓글 등록에 실패했습니다.");
    }
  };

  // 답글 등록
  const handleReplySubmit = async (parent) => {
    if (!replyInput[parent] || !replyInput[parent].trim()) return;
    try {
      const res = await fetch(`/api/schedules/${scheduleId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyInput[parent], parentId: parent }),
      });
      if (!res.ok) throw new Error("답글 등록 실패");
      setReplyInput(prev => ({ ...prev, [parent]: "" }));
      notifySuccess("답글이 등록되었습니다.");
      setRefresh(r => r + 1);
    } catch {
      notifyError("답글 등록에 실패했습니다.");
    }
  };

  // 삭제
  const handleDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/schedules/${scheduleId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("삭제 실패");
      notifySuccess("삭제되었습니다.");
      setRefresh(r => r + 1);
    } catch {
      notifyError("삭제에 실패했습니다.");
    }
  };

  const rootComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);
  const getReplies = (parentId) => replies.filter(r => r.parent_id === parentId);

  return (
    <div className={styles["comment-list-wrap"]}>
      <h3>일정 댓글</h3>
      {isLogin ? (
        <form className={styles["comment-form"]} onSubmit={handleSubmit}>
          <textarea
            placeholder="댓글을 입력하세요"
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={2}
            className={styles.textarea}
          />
          <button type="submit" className={styles.button}>등록</button>
        </form>
      ) : (
        <div className={styles["comment-login-ask"]}>로그인 후 댓글 작성 가능</div>
      )}
      <ul className={styles["comment-list"]}>
        {rootComments.map(comment => (
          <li key={comment.id} className={styles["comment-item"]}>
            <div className={styles["comment-head"]}>
              <b>{comment.author}</b>
              <span className={styles["comment-date"]}>{new Date(comment.created_at).toLocaleString()}</span>
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
            <div className={styles["comment-content"]}>{comment.content}</div>
            {parentId === comment.id && (
              <div className={styles["comment-reply-form"]}>
                <textarea
                  placeholder="답글을 입력하세요"
                  value={replyInput[comment.id] || ""}
                  onChange={e => setReplyInput(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  rows={2}
                  className={styles.textarea}
                />
                <button
                  className={styles.button}
                  onClick={() => handleReplySubmit(comment.id)}
                  type="button"
                >
                  등록
                </button>
              </div>
            )}
            <ul className={styles["comment-replies"]}>
              {getReplies(comment.id).map(reply => (
                <li key={reply.id} className={`${styles["comment-item"]} ${styles["comment-reply"]}`}>
                  <div className={styles["comment-head"]}>
                    <b>{reply.author}</b>
                    <span className={styles["comment-date"]}>{new Date(reply.created_at).toLocaleString()}</span>
                    {isLogin && reply.author === currentUser && (
                      <button className={styles["comment-del"]} onClick={() => handleDelete(reply.id)}>삭제</button>
                    )}
                  </div>
                  <div className={styles["comment-content"]}>{reply.content}</div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
