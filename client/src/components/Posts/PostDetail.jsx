import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CommentList from './CommentList';
import { notifySuccess, notifyError } from '../../utils/notify';
import styles from '../../styles/PostDetail.module.scss';

export default function PostDetail({ isLogin }) {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts/${postId}`)
      .then(res => {
        if (!res.ok) throw new Error('게시글을 찾을 수 없습니다.');
        return res.json();
      })
      .then(data => setPost(data))
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

  if (loading) return <div className={styles['post-detail-wrap']}>불러오는 중...</div>;
  if (!post) return <div className={styles['post-detail-wrap']}>게시글이 없습니다.</div>;

  return (
    <div className={styles['post-detail-wrap']}>
      <div className={styles['post-detail-header']}>
        <h2 className={styles['post-detail-title']}>{post.title}</h2>
        <div className={styles['post-detail-meta']}>
          작성자: <b>{post.author}</b> &nbsp;|&nbsp;
          작성일: {new Date(post.created_at).toLocaleString()} &nbsp;|&nbsp;
          조회수: {post.views ?? 0}
        </div>
        {isLogin && post.author === username && (
          <div className={styles['post-detail-buttons']}>
            <button
              className={styles['btn-edit']}
              onClick={() => navigate(`/board/free/${postId}/edit`)}
            >
              수정
            </button>
            <button
              className={styles['btn-delete']}
              onClick={handleDelete}
            >
              삭제
            </button>
          </div>
        )}
      </div>
      <div className={styles['post-detail-body']}>{post.content}</div>
      <CommentList postId={post.id} isLogin={isLogin} currentUser={username} />
    </div>
  );
}
