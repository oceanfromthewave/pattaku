// src/components/Posts/CommentList.jsx
import { useEffect, useState } from 'react';
import { notifySuccess, notifyError } from '../../utils/notify';
import styles from '../../styles/CommentList.module.scss';

export default function CommentList({ postId, isLogin, currentUser, showLike = true, type = 'post' }) {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [parentId, setParentId] = useState(null);
  const [replyInput, setReplyInput] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [likeStates, setLikeStates] = useState({}); // {commentId: {count, liked}}

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`/api/${type === 'schedule' ? 'schedules' : 'posts'}/${postId}/comments`)
      .then(res => res.json())
      .then(data => {
        setComments(data);
        // 댓글 추천 상태 같이 로드 (API에서 지원할 경우)
        if (showLike) {
          const obj = {};
          data.forEach(c => obj[c.id] = { count: c.likes || 0, liked: c.isLiked || false });
          setLikeStates(obj);
        }
      });
  }, [postId, refresh, type, showLike]);

  // 댓글 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await fetch(`/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, content: input, parentId: null, type }),
      });
      setInput('');
      setRefresh(v => v + 1);
      notifySuccess('댓글이 등록되었습니다.');
    } catch {
      notifyError('댓글 등록 실패');
    }
  };

  // 답글 등록
  const handleReplySubmit = async (parentId) => {
    if (!replyInput[parentId] || !replyInput[parentId].trim()) return;
    try {
      await fetch(`/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, content: replyInput[parentId], parentId, type }),
      });
      setReplyInput(prev => ({ ...prev, [parentId]: '' }));
      setParentId(null);
      setRefresh(v => v + 1);
      notifySuccess('답글이 등록되었습니다.');
    } catch {
      notifyError('답글 등록 실패');
    }
  };

  // 삭제
  const handleDelete = async (commentId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setRefresh(v => v + 1);
      notifySuccess('삭제되었습니다.');
    } catch {
      notifyError('삭제 실패');
    }
  };

  // 댓글 추천
  const handleLike = async (commentId) => {
    if (!token) {
      notifyError('로그인 후 추천 가능합니다.');
      return;
    }
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setLikeStates(prev => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          count: prev[commentId].liked ? prev[commentId].count - 1 : prev[commentId].count + 1,
          liked: !prev[commentId].liked,
        },
      }));
    } catch {
      notifyError('추천 처리 실패');
    }
  };

  // 댓글/답글 분리
  const rootComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);
  const getReplies = (parentId) => replies.filter(r => r.parent_id === parentId);

  return (
    <div className={styles['comment-list-wrap']}>
      <div className={styles['comment-list-inner']}>
        {isLogin ? (
          <form className={styles['comment-form']} onSubmit={handleSubmit}>
            <textarea
              placeholder="댓글을 입력하세요"
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={2}
              className={styles.textarea}
              maxLength={400}
            />
            <button type="submit" className={styles.button}>등록</button>
          </form>
        ) : (
          <div className={styles['comment-login-ask']}>로그인 후 댓글 작성 가능</div>
        )}
        <ul className={styles['comment-list']}>
          {rootComments.map(comment => (
            <li key={comment.id} className={styles['comment-item']}>
              <div className={styles['comment-head']}>
                <span className={styles['comment-author']}>{comment.author_nickname || comment.author}</span>
                <span className={styles['comment-date']}>{new Date(comment.created_at).toLocaleString()}</span>
                {showLike && (
                  <button
                    className={`${styles['comment-like-btn']} ${likeStates[comment.id]?.liked ? styles['liked'] : ''}`}
                    onClick={() => handleLike(comment.id)}
                    type="button"
                  >
                    👍 {likeStates[comment.id]?.count || 0}
                  </button>
                )}
                {isLogin && comment.author === currentUser && (
                  <button className={styles['comment-del']} onClick={() => handleDelete(comment.id)}>
                    삭제
                  </button>
                )}
                {isLogin && (
                  <button
                    className={styles['comment-reply-btn']}
                    onClick={() => setParentId(parentId === comment.id ? null : comment.id)}
                  >
                    {parentId === comment.id ? '취소' : '답글'}
                  </button>
                )}
              </div>
              <div className={styles['comment-content']}>{comment.content}</div>
              {/* 답글 입력폼 */}
              {parentId === comment.id && (
                <div className={styles['comment-reply-form']}>
                  <textarea
                    placeholder="답글을 입력하세요"
                    value={replyInput[comment.id] || ''}
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
              {/* 답글(들) */}
              <ul className={styles['comment-replies']}>
                {getReplies(comment.id).map(reply => (
                  <li key={reply.id} className={`${styles['comment-item']} ${styles['comment-reply']}`}>
                    <div className={styles['comment-head']}>
                      <span className={styles['comment-author']}>{reply.author_nickname || reply.author}</span>
                      <span className={styles['comment-date']}>{new Date(reply.created_at).toLocaleString()}</span>
                      {showLike && (
                        <button
                          className={`${styles['comment-like-btn']} ${likeStates[reply.id]?.liked ? styles['liked'] : ''}`}
                          onClick={() => handleLike(reply.id)}
                          type="button"
                        >
                          👍 {likeStates[reply.id]?.count || 0}
                        </button>
                      )}
                      {isLogin && reply.author === currentUser && (
                        <button className={styles['comment-del']} onClick={() => handleDelete(reply.id)}>
                          삭제
                        </button>
                      )}
                    </div>
                    <div className={styles['comment-content']}>{reply.content}</div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
