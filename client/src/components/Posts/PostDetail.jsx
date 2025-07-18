import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CommentList from './CommentList';
import { notifySuccess, notifyError } from '../../utils/notify';
import classNames from 'classnames';
import styles from '../../styles/PostDetail.module.scss';

const API_SERVER = import.meta.env.VITE_API_SERVER || '';
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || (API_SERVER + '/uploads');

export default function PostDetail({ isLogin }) {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_SERVER}/api/posts/${postId}`),
      fetch(`${API_SERVER}/api/posts/${postId}/history`)
    ])
      .then(async ([resPost, resHist]) => {
        if (!resPost.ok) throw new Error('게시글을 찾을 수 없습니다.');
        const data = await resPost.json();
        setPost(data);
        setLikeCount(data.likes || 0);
        setDislikeCount(data.dislikes || 0);
        setIsLiked(data.isLiked || false);
        setIsDisliked(data.isDisliked || false);
        setHistory(resHist.ok ? await resHist.json() : []);
      })
      .catch(err => {
        notifyError(err.message);
        setPost(null);
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const handleDelete = async () => {
    if (!window.confirm('정말 게시글을 삭제하시겠습니까?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_SERVER}/api/posts/${postId}`, {
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

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      notifyError('로그인 후 추천할 수 있습니다.');
      return;
    }
    try {
      const res = await fetch(`${API_SERVER}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('추천 처리 실패');
      setLikeCount(likeCount + (isLiked ? -1 : 1));
      setIsLiked(!isLiked);
      if (isDisliked) {
        setDislikeCount(dislikeCount - 1);
        setIsDisliked(false);
      }
      notifySuccess(isLiked ? '추천 취소됨' : '추천되었습니다!');
    } catch {
      notifyError('추천 처리 중 오류');
    }
  };

  const handleDislike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      notifyError('로그인 후 이용 가능합니다.');
      return;
    }
    try {
      const res = await fetch(`${API_SERVER}/api/posts/${postId}/dislike`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('처리 실패');
      setDislikeCount(dislikeCount + (isDisliked ? -1 : 1));
      setIsDisliked(!isDisliked);
      if (isLiked) {
        setLikeCount(likeCount - 1);
        setIsLiked(false);
      }
      notifySuccess(isDisliked ? '싫어요 취소됨' : '싫어요 처리됨');
    } catch {
      notifyError('싫어요 처리 중 오류');
    }
  };

  const handleRestoreHistory = (hist) => {
    if (!window.confirm('이전 내용으로 복구하시겠습니까?')) return;
    notifySuccess('수정화면에서 복구 가능합니다!');
    navigate(`/board/free/${postId}/edit`, { state: { restore: hist } });
  };

  // 첨부파일 미리보기
  const renderAttachments = () => {
    if (!post?.files || post.files.length === 0) return null;
    return (
      <div className={styles.attachments}>
        {post.files.map((file, idx) => {
          // /uploads/로 오든, 파일명만 오든 확실히 절대경로로 만듦
          const fileUrl = file.url.startsWith('http')
            ? file.url
            : `${UPLOADS_URL}/${file.url.replace(/^\/?uploads\//, '')}`;
          return fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <img
              key={idx}
              src={fileUrl}
              alt={`첨부이미지${idx + 1}`}
              className={styles.attachmentImg}
              loading="lazy"
            />
          ) : (
            <a
              key={idx}
              href={fileUrl}
              download
              className={styles.attachmentFile}
            >
              📎 {file.name || '첨부파일'}
            </a>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className={styles['post-detail-wrap']}>불러오는 중...</div>;
  if (!post) return <div className={styles['post-detail-wrap']}>게시글이 없습니다.</div>;

  const isAuthor = isLogin && post && String(post.user_id) === String(userId);

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
            className={classNames(styles['like-btn'], { [styles['liked']]: isLiked })}
            onClick={handleLike}
            aria-pressed={isLiked}
          >
            👍 추천 {likeCount}
          </button>
          <button
            type="button"
            className={classNames(styles['dislike-btn'], { [styles['disliked']]: isDisliked })}
            onClick={handleDislike}
            aria-pressed={isDisliked}
          >
            👎 싫어요 {dislikeCount}
          </button>
          <button
            type="button"
            className={styles['history-btn']}
            onClick={() => setShowHistory(v => !v)}
            aria-expanded={showHistory}
          >
            📝 수정내역
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
        {showHistory && history.length > 0 && (
          <div className={styles['history-box']}>
            <ul>
              {history.map(hist => (
                <li key={hist.id}>
                  <span>[{new Date(hist.updated_at).toLocaleString()}] {hist.editor_nickname || hist.editor}</span>
                  <button
                    type="button"
                    className={styles['restore-btn']}
                    onClick={() => handleRestoreHistory(hist)}
                  >복구</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className={styles['post-detail-body']}>
        {post.content}
        {renderAttachments()}
      </div>
      <div className={styles['post-comment-divider']} />
      <CommentList postId={post.id} isLogin={isLogin} currentUser={userId} />
    </div>
  );
}
