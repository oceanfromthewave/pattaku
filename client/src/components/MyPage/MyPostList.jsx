import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyPosts, getApiErrorMessage } from '../../api/userApi';
import { notifyError } from '../../utils/notify';
import Pagination from '../Pagination';
import styles from '../../styles/MyPage.module.scss';

export default function MyPostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadPosts(1);
  }, []);

  const loadPosts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getMyPosts({ page, limit: 10 });
      setPosts(response.posts);
      setPagination(response.pagination);
    } catch (error) {
      console.error('내 글 목록 로드 오류:', error);
      notifyError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    loadPosts(newPage);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>내가 쓴 글을 불러오는 중...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>📝 아직 작성한 게시글이 없습니다.</p>
        <Link to="/board/free" className={styles.writeBtn}>
          첫 번째 글 작성하기
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.myPostList}>
      <div className={styles.listHeader}>
        <h3>📝 내가 쓴 글 ({pagination.total}개)</h3>
      </div>

      <div className={styles.postList}>
        {posts.map(post => (
          <div key={post.id} className={styles.postItem}>
            <div className={styles.postHeader}>
              <Link 
                to={`/board/free/${post.id}`} 
                className={styles.postTitle}
              >
                {post.title}
              </Link>
              <div className={styles.postMeta}>
                <span className={styles.postDate}>
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                <div className={styles.postStats}>
                  <span>👁️ {post.views || 0}</span>
                  <span>💬 {post.comment_count || 0}</span>
                  <span>👍 {post.likes || 0}</span>
                  <span>👎 {post.dislikes || 0}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.postContent}>
              {post.content.length > 100 
                ? `${post.content.substring(0, 100)}...` 
                : post.content
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
