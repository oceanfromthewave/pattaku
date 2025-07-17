// src/components/Posts/PostDetail.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CommentList from './CommentList';
import { notifySuccess, notifyError } from '../../utils/notify';
import styles from '../../styles/PostDetail.module.scss';

export default function PostDetail({ isLogin }) {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username');
  const nickname = localStorage.getItem('nickname');
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // 게시글 데이터 불러오기
  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts/${postId}`)
      .then(res => {
        if (!res.ok) throw new Error('게시글을 찾을 수 없습니다.');
        return res.json();
      })
      .then(data => {
        setPost(data);
        setLikeCount(data.likes || 0);
        setIsLiked(data.isLiked || false);
      })
      .catch(err => {
        notifyError(err.message);
        setPost(null);
      })
      .finally(() => setLoading(false));
  }, [postId]);

  // 게시글 삭제
  const handleDelete = async () => {
    if (!window.confirm('정말 게시글을 삭제하시겠습니까?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        notifySuccess('게시글이 삭제되었습니다.');
        navigate('/board/free');
      } else {
        notifyError('삭제에 실패했습니다.');
      }
    } catch {
      notifyError('네트워크 오류가 발생했습니다.');
    }
  };

  // 게시글 추천(Like)
  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      notifyError('로그인 후 추천할 수 있습니다.');
      return;
    }
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('추천 처리 실패');
      setLikeCount(likeCount + (isLiked ? -1 : 1));
      setIsLiked(!isLiked);
      notifySuccess(isLiked ? '추천 취소됨' : '추천되었습니다!');
    } catch {
      notifyError('추천 처리 중 오류');
    }
  };

  const isAuthor = isLogin && post && post.author === username;

  if (loading) return <div className={styles['post-detail-wrap']}>불러오는 중...</div>;
  if (!post) return <div className={styles['post-detail-wrap']}>게시글이 없습니다.</div>;

  return (
    <div className={styles['post-detail-wrap']}>
      <div className={styles['post-detail-header']}>
        <h2 className={styles['post-detail-title']}>{post.title}</h2>
        <div className={styles['post-detail-meta']}>
          <span>
            작성자: <b>{post.author_nickname || post.author}</b>
          </span>
          <span>&nbsp;|&nbsp;작성일: {new Date(post.created_at).toLocaleString()}</span>
          <span>&nbsp;|&nbsp;조회수: {post.views ?? 0}</span>
        </div>
        <div className={styles['post-detail-actions']}>
          <button
            type="button"
            className={`${styles['like-btn']} ${isLiked ? styles['liked'] : ''}`}
            onClick={handleLike}
            aria-pressed={isLiked}
          >
            👍 추천 {likeCount}
          </button>
          {isAuthor && (
            <span>
              <button
                className={styles['edit-btn']}
                onClick={() => navigate(`/board/free/${postId}/edit`)}
              >
                수정
              </button>
              <button className={styles['delete-btn']} onClick={handleDelete}>
                삭제
              </button>
            </span>
          )}
        </div>
      </div>
      <div className={styles['post-detail-body']}>{post.content}</div>
      {/* 댓글 구분선 */}
      <div className={styles['post-comment-divider']} />
      <CommentList postId={post.id} isLogin={isLogin} currentUser={username} />
    </div>
  );
}
