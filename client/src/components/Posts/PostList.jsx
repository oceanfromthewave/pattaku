import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../../api/postApi';
import { notifyError } from '../../utils/notify';
import styles from '../../styles/PostList.module.scss';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', author: '', sort: 'recent' });
  const [searchInput, setSearchInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          ...filters,
        };
        const data = await getPosts(params);
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        notifyError('게시글을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [filters, currentPage]);

  const handleSearch = () => {
    setFilters({ ...filters, q: searchInput, author: authorInput });
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setFilters({ ...filters, sort: e.target.value });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters({ q: '', author: '', sort: 'recent' });
    setSearchInput('');
    setAuthorInput('');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}분 전`;
    if (hours < 24) return `${Math.floor(hours)}시간 전`;
    if (hours < 24 * 7) return `${Math.floor(hours / 24)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`${styles.paginationBtn} ${i === currentPage ? styles.active : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className={styles.pagination}>
        <button
          className={styles.paginationBtn}
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          ⏮️
        </button>
        <button
          className={styles.paginationBtn}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ⬅️
        </button>
        {pages}
        <button
          className={styles.paginationBtn}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ➡️
        </button>
        <button
          className={styles.paginationBtn}
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          ⏭️
        </button>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📝 게시글</h1>
        <p className="page-subtitle">커뮤니티의 다양한 이야기를 만나보세요</p>
      </div>

      {/* 검색 및 필터 */}
      <div className={styles.postFilters}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label>제목/내용 검색</label>
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label>작성자 검색</label>
            <input
              type="text"
              placeholder="작성자명을 입력하세요"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label>정렬</label>
            <select
              value={filters.sort}
              onChange={handleSortChange}
            >
              <option value="recent">최신순</option>
              <option value="popular">인기순</option>
            </select>
          </div>
        </div>
        
        <div className={styles.filterActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSearch}>
            🔍 검색
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleReset}>
            🔄 초기화
          </button>
          <button 
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={() => navigate('/posts/new')}
          >
            ✏️ 글쓰기
          </button>
        </div>
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>게시글을 불러오는 중...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📭</div>
          <h3>게시글이 없습니다</h3>
          <p>첫 번째 게시글을 작성해보세요!</p>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => navigate('/posts/new')}
          >
            ✏️ 첫 게시글 작성하기
          </button>
        </div>
      ) : (
        <>
          <div className={styles.postList}>
            {posts.map((post) => (
              <article 
                key={post.id}
                className={styles.postCard}
                onClick={() => navigate(`/posts/${post.id}`)}
              >
                <div className={styles.postHeader}>
                  <h2 className={styles.postTitle}>
                    {post.title}
                    {post.files_count > 0 && (
                      <span className={styles.attachmentBadge}>📎</span>
                    )}
                  </h2>
                  <div className={styles.postMeta}>
                    <span className={styles.postAuthor}>👤 {post.author_nickname || post.author}</span>
                    <span className={styles.postDate}>🕒 {formatDate(post.created_at)}</span>
                  </div>
                </div>
                
                <div className={styles.postContent}>
                  <p className={styles.postExcerpt}>
                    {post.content ? post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '') : '내용이 없습니다.'}
                  </p>
                </div>
                
                <div className={styles.postStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>👁️</span>
                    <span className={styles.statValue}>{post.views || 0}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>👍</span>
                    <span className={styles.statValue}>{post.likes || 0}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>💬</span>
                    <span className={styles.statValue}>{post.comments_count || 0}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          
          {renderPagination()}
        </>
      )}
    </div>
  );
}

export default PostList;
