import { useEffect, useState } from "react";
import { notifySuccess, notifyError } from "../../utils/notify";
import styles from "../../styles/CommentList.module.scss";

export default function CommentList({ postId, isLogin, currentUser }) {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [parentId, setParentId] = useState(null);
  const [replyInput, setReplyInput] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch(() => notifyError("댓글을 불러오는 중 오류가 발생했습니다."));
  }, [postId, refresh]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) {
      notifyError("댓글 내용을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, content: input, parentId: null }),
      });
      if (res.ok) {
        notifySuccess("댓글이 등록되었습니다.");
        setInput("");
        setRefresh((v) => v + 1);
      } else {
        const data = await res.json();
        notifyError(data.error || "댓글 등록에 실패했습니다.");
      }
    } catch {
      notifyError("네트워크 오류");
    }
    setLoading(false);
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyInput[parentId] || !replyInput[parentId].trim()) {
      notifyError("답글 내용을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, content: replyInput[parentId], parentId }),
      });
      if (res.ok) {
        notifySuccess("답글이 등록되었습니다.");
        setReplyInput((prev) => ({ ...prev, [parentId]: "" }));
        setRefresh((v) => v + 1);
        setParentId(null);
      } else {
        const data = await res.json();
        notifyError(data.error || "답글 등록에 실패했습니다.");
      }
    } catch {
      notifyError("네트워크 오류");
    }
    setLoading(false);
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        notifySuccess("댓글이 삭제되었습니다.");
        setRefresh((v) => v + 1);
      } else {
        notifyError("댓글 삭제에 실패했습니다.");
      }
    } catch {
      notifyError("네트워크 오류");
    }
    setLoading(false);
  };

  const rootComments = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => c.parent_id);
  const getReplies = (parentId) => replies.filter((r) => r.parent_id === parentId);

  return (
    <div className={styles["comment-list-wrap"]}>
      <h3>댓글</h3>
      {isLogin ? (
        <form className={styles["comment-form"]} onSubmit={handleSubmit}>
          <textarea
            placeholder="댓글을 입력하세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            className={styles.textarea}
            disabled={loading}
          />
          <button type="submit" className={styles.button} disabled={loading}>
            등록
          </button>
        </form>
      ) : (
        <div className={styles["comment-login-ask"]}>로그인 후 댓글을 작성할 수 있습니다.</div>
      )}
      <ul className={styles["comment-list"]}>
        {rootComments.map((comment) => (
          <li key={comment.id} className={styles["comment-item"]}>
            <div className={styles["comment-head"]}>
              <b>{comment.author}</b>
              <span className={styles["comment-date"]}>
                {new Date(comment.created_at).toLocaleString()}
              </span>
              {isLogin && comment.author === currentUser && (
                <button
                  className={styles["comment-del"]}
                  onClick={() => handleDelete(comment.id)}
                  disabled={loading}
                >
                  삭제
                </button>
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
                  onChange={(e) =>
                    setReplyInput((prev) => ({ ...prev, [comment.id]: e.target.value }))
                  }
                  rows={2}
                  className={styles.textarea}
                  disabled={loading}
                />
                <button
                  className={styles.button}
                  onClick={() => handleReplySubmit(comment.id)}
                  disabled={loading}
                >
                  등록
                </button>
              </div>
            )}
            <ul className={styles["comment-replies"]}>
              {getReplies(comment.id).map((reply) => (
                <li key={reply.id} className={`${styles["comment-item"]} ${styles["comment-reply"]}`}>
                  <div className={styles["comment-head"]}>
                    <b>{reply.author}</b>
                    <span className={styles["comment-date"]}>
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                    {isLogin && reply.author === currentUser && (
                      <button
                        className={styles["comment-del"]}
                        onClick={() => handleDelete(reply.id)}
                        disabled={loading}
                      >
                        삭제
                      </button>
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
