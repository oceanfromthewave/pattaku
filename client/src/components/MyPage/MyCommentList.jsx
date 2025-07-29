import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyComments, getApiErrorMessage } from '../../api/userApi';
import { notifyError } from '../../utils/notify';
import Pagination from '../Pagination';
import styles from '../../styles/MyPage.module.scss';

export default function MyCommentList() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadComments(1);
  }, []);

  const loadComments = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getMyComments({ page, limit: 10 });
      setComments(response.comments);
      setPagination(response.pagination);
    } catch (error) {
      console.error('내 댓글 목록 로드 오류:', error);
      notifyError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    loadComments(newPage);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>내가 쓴 댓글을 불러오는 중...</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>💬 아직 작성한 댓글이 없습니다.</p>
        <Link to="/board/free" className={styles.writeBtn}>
          게시판에서 댓글 작성하기
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.myCommentList}>
      <div className={styles.listHeader}>
        <h3>💬 내가 쓴 댓글 ({pagination.total}개)</h3>
      </div>

      <div className={styles.commentList}>
        {comments.map(comment => (
          <div key={comment.id} className={styles.commentItem}>
            <div className={styles.commentHeader}>
              <Link 
                to={`/board/free/${comment.post_id}`} 
                className={styles.postTitle}
              >
                📄 {comment.post_title}
              </Link>
              <div className={styles.commentMeta}>
                <span className={styles.commentDate}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
                <div className={styles.commentStats}>
                  <span>👍 {comment.likes || 0}</span>
                  <span>👎 {comment.dislikes || 0}</span>
                  {comment.parent_id && (
                    <span className={styles.replyBadge}>답글</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.commentContent}>
              {comment.content.length > 150 
                ? `${comment.content.substring(0, 150)}...` 
                : comment.content
              }
            </div>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
