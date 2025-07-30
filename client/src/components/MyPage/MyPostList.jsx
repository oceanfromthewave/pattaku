import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyPosts, getApiErrorMessage } from '../../api/userApi';
import { notifyError } from '../../utils/notify';
import Pagination from '../Pagination';
import styles from '../../styles/MyPostList.module.scss';

export default function MyPostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadPosts(1);
    // eslint-disable-next-line
  }, []);

  const loadPosts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getMyPosts({ page, limit: 10 });
      setPosts(response.posts);
      setPagination(response.pagination);
    } catch (error) {
      notifyError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => loadPosts(newPage);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>내가 쓴 글을 불러오는 중...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📝</div>
        <div className={styles.emptyText}>작성한 게시글이 없습니다</div>
        <p className={styles.emptySub}>첫 번째 게시글을 작성해보세요!</p>
        <Link to="/posts/new" className={styles.writeBtn}>
          ✏️ 첫 글 작성하기
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.myPostListRoot}>
      <div className={styles.headerWrap}>
        <h2 className={styles.title}>📝 내가 쓴 글</h2>
        <span className={styles.count}>총 {pagination.total}개</span>
      </div>

      <div className={styles.listWrap}>
        {posts.map((post, idx) => (
          <div key={post.id} className={styles.card}>
            <div className={styles.cardHead}>
              <Link
                to={`/posts/${post.id}`}
                className={styles.cardTitle}
              >
                {post.title}
              </Link>
              <div className={styles.meta}>
                <span className={styles.date}>📅 {formatDate(post.created_at)}</span>
                <span className={styles.views}>👁️ {post.view_count || 0}</span>
                <span className={styles.comments}>💬 {post.comment_count || 0}</span>
                <span className={styles.likes}>👍 {post.like_count || 0}</span>
                <span className={styles.dislikes}>👎 {post.dislike_count || 0}</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              {post.content?.length > 140
                ? post.content.slice(0, 140) + '...'
                : post.content
              }
            </div>
            <div className={styles.cardFooter}>
              <Link to={`/posts/${post.id}`} className={styles.detailBtn}>
                자세히 보기 →
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
