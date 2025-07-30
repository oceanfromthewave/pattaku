import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CommentList from './CommentList';
import { notifySuccess, notifyError } from '../../utils/notify';
import { getPost, deletePost, likePost, dislikePost } from '../../api/postApi';
import styles from '../../styles/PostDetail.module.scss';

const API_SERVER = import.meta.env.VITE_API_SERVER || '';
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || (API_SERVER + '/uploads');

function PostDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const data = await getPost(postId);
        setPost(data);
        setLikeCount(data.likes || 0);
        setDislikeCount(data.dislikes || 0);
        setIsLiked(data.isLiked || false);
        setIsDisliked(data.isDisliked || false);
      } catch (err) {
        notifyError(err.message || '게시글을 불러오지 못했습니다.');
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deletePost(postId);
      notifySuccess('게시글이 삭제되었습니다.');
      navigate('/posts');
    } catch (err) {
      notifyError(err.message || '삭제에 실패했습니다.');
    }
  };

  const handleLike = async () => {
    try {
      const data = await likePost(postId);
      setLikeCount(data.likes);
      setDislikeCount(data.dislikes);
      setIsLiked(data.liked);
      setIsDisliked(data.disliked);
      notifySuccess(data.liked ? '좋아요!' : '좋아요 취소');
    } catch (err) {
      notifyError(err.message || '처리 실패');
    }
  };

  const handleDislike = async () => {
    try {
      const data = await dislikePost(postId);
      setLikeCount(data.likes);
      setDislikeCount(data.dislikes);
      setIsLiked(data.liked);
      setIsDisliked(data.disliked);
      notifySuccess(data.disliked ? '싫어요!' : '싫어요 취소');
    } catch (err) {
      notifyError(err.message || '처리 실패');
    }
  };

  const renderAttachments = () => {
    if (!post?.files || post.files.length === 0) return null;
    return (
      <div className={styles.attachments}>
        {post.files.map((file, idx) => {
          const fileUrl = file.url.startsWith('http')
            ? file.url
            : `${UPLOADS_URL}/${file.url.replace(/^\/?uploads\//, '')}`;
          if (fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" key={idx}>
                <img src={fileUrl} alt={`첨부 ${idx + 1}`} className={styles.attachmentImg} />
              </a>
            );
          }
          return (
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className={styles.attachmentFile}
              key={idx}
            >
              {file.name || '파일 다운로드'}
            </a>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${styles.card} ${styles.loadingContainer}`}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>게시글을 불러오는 중...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={`${styles.card} ${styles.emptyState}`}>
        <div className={styles.emptyStateIcon}>📭</div>
        <div className={styles.emptyText}>게시글을 찾을 수 없습니다.</div>
        <button className={`btn btnPrimary`} onClick={() => navigate('/posts')}>목록으로</button>
      </div>
    );
  }

  const isAuthor = String(post.user_id) === String(userId);

  return (
    <div className={styles.postDetailRoot}>
    <div className={`${styles.card} ${styles.postDetail}`}>
      <div className={styles.postHeader}>
        <h1 className={styles.postTitle}>{post.title}</h1>
        <div className={styles.postMeta}>
          <span>👤 {post.author_nickname || post.author}</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>🕒 {new Date(post.created_at).toLocaleString()}</span>
          <span style={{ marginLeft: 12 }}>
            👁️ {post.views ?? 0}
          </span>
        </div>
      </div>
      <div className={styles.postContent}>
        {post.content ? post.content : <span className={styles.textSecondary}>내용이 없습니다.</span>}
        {renderAttachments()}
      </div>
      <div className={styles.postActions}>
        <button
          className={`btn btnOutline${isLiked ? ' active' : ''}`}
          onClick={handleLike}
          type="button"
        >
          👍 {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button
          className={`btn btnOutline${isDisliked ? ' active' : ''}`}
          onClick={handleDislike}
          type="button"
        >
          👎 {dislikeCount > 0 && <span>{dislikeCount}</span>}
        </button>
        {isAuthor && (
          <>
            <button
              className="btn btnSecondary"
              onClick={() => navigate(`/posts/${postId}/edit`)}
              type="button"
            >
              ✏️ 수정
            </button>
            <button
              className={`btn ${styles.btnDanger}`}
              onClick={handleDelete}
              type="button"
            >
              🗑️ 삭제
            </button>
          </>
        )}
        <button className="btn btnSecondary" onClick={() => navigate('/posts')}>목록</button>
      </div>
      <div className={styles.postCommentDivider}></div>
      <CommentList
        postId={post.id}
        currentUser={userId}
        isLogin={!!localStorage.getItem('token')}
      />
    </div>
    </div>
  );
}

export default PostDetail;
