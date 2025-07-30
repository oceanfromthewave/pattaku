import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyComments, getApiErrorMessage } from '../../api/userApi';
import { notifyError } from '../../utils/notify';
import Pagination from '../Pagination';
import styles from '../../styles/MyCommentList.module.scss';

export default function MyCommentList() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadComments(1);
    // eslint-disable-next-line
  }, []);

  const loadComments = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getMyComments({ page, limit: 10 });
      setComments(response.comments);
      setPagination(response.pagination);
    } catch (error) {
      notifyError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => loadComments(newPage);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const truncate = (str, max = 100) =>
    str && str.length > max ? str.slice(0, max) + '...' : str;

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <div>내가 쓴 댓글을 불러오는 중...</div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>💬</div>
        <div className={styles.emptyText}>작성한 댓글이 없습니다</div>
        <div className={styles.emptySub}>게시글에 첫 댓글을 남겨보세요!</div>
        <Link to="/posts" className={styles.writeBtn}>
          💬 게시글 보러가기
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.myCommentList}>
      <div className={styles.header}>
        <h2>💬 내가 쓴 댓글</h2>
        <span className={styles.count}>총 {pagination.total}개</span>
      </div>
      <div className={styles.list}>
        {comments.map((comment) => (
          <div key={comment.id} className={styles.commentItem}>
            <div className={styles.itemHead}>
              <span
                className={styles.type}
                style={{
                  background: comment.post_id
                    ? 'var(--primary-50, #fef7ee)'
                    : 'var(--success-50, #dcfce7)',
                  color: comment.post_id
                    ? 'var(--primary-700, #c2410c)'
                    : 'var(--success-700, #047857)',
                }}
              >
                {comment.post_id ? '게시글' : '일정'} 댓글
              </span>
              <span className={styles.date}>📅 {formatDate(comment.created_at)}</span>
            </div>
            <div className={styles.itemContent}>
              <span className={styles.text}>{truncate(comment.content, 120)}</span>
              {comment.parent_id && (
                <span className={styles.replyTag}>↳ 답글</span>
              )}
            </div>
            <div className={styles.itemFooter}>
              <div className={styles.meta}>
                {comment.like_count > 0 && (
                  <span className={styles.likes}>👍 {comment.like_count}</span>
                )}
                {comment.dislike_count > 0 && (
                  <span className={styles.dislikes}>👎 {comment.dislike_count}</span>
                )}
              </div>
              <Link
                to={comment.post_id ? `/posts/${comment.post_id}` : `/schedules/${comment.schedule_id}`}
                className={styles.detailBtn}
              >
                {comment.post_title
                  ? truncate(comment.post_title, 32)
                  : '원글 보기'} →
              </Link>
            </div>
          </div>
        ))}
      </div>
      {pagination.totalPages > 1 && (
        <div className={styles.paginationWrap}>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={pagination.limit}
            totalItems={pagination.total}
          />
        </div>
      )}
    </div>
  );
}
