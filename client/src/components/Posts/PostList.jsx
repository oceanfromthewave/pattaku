import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { getPosts } from '../../api/postApi';
import { notifyError } from '../../utils/notify';
import Loading from '../Loading';
import Pagination from '../Pagination';
import styles from '../../styles/PostList.module.scss';

export default function PostList({ refreshCount }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ keyword: '', author: '', sort: 'recent' });
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // 게시글 불러오기
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          ...filter
        };
        
        const data = await getPosts(params);
        setPosts(data.posts || data); // 백엔드 응답 구조에 따라 조정
        setTotalPages(data.totalPages || Math.ceil((data.total || data.length) / itemsPerPage));
        setTotalItems(data.total || data.length);
      } catch (error) {
        console.error('게시글 로딩 실패:', error);
        notifyError('게시글을 불러오는데 실패했습니다.');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [refreshCount, filter, currentPage]);

  // 검색 폼 전송
  const handleSearch = (e) => {
    e.preventDefault();
    setFilter({ ...filter, keyword: search });
    setCurrentPage(1); // 검색 시 첫 페이지로
  };

  // 정렬 토글
  const toggleSort = () => {
    setFilter(f => ({
      ...f,
      sort: f.sort === 'recent' ? 'popular' : 'recent'
    }));
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 작성자 필터 변경
  const handleAuthorChange = (e) => {
    setFilter(f => ({ ...f, author: e.target.value }));
    setCurrentPage(1);
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilter({ keyword: '', author: '', sort: 'recent' });
    setSearch('');
    setCurrentPage(1);
  };

  if (loading) return <Loading message="게시글을 불러오는 중..." />;

  return (
    <div className={classNames(styles.postList, 'postList')}>
      <div className={styles.listHeader}>
        <h3 className={styles.listTitle}>자유게시판</h3>
        <button 
          className={styles.resetBtn}
          onClick={resetFilters}
          title="필터 초기화"
        >
          초기화
        </button>
      </div>

      <form className={styles.searchBar} onSubmit={handleSearch}>
        <div className={styles.searchGroup}>
          <input
            type="text"
            placeholder="제목/내용/태그 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <input
            type="text"
            placeholder="작성자"
            value={filter.author}
            onChange={handleAuthorChange}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.controlGroup}>
          <button type="submit" className={styles.searchBtn}>검색</button>
          <button
            type="button"
            className={styles.sortBtn}
            onClick={toggleSort}
          >
            {filter.sort === 'recent' ? '📅 최신순' : '👍 인기순'}
          </button>
        </div>
      </form>

      {posts.length === 0 ? (
        <div className={styles.noPost}>
          <div className={styles.noPostIcon}>📝</div>
          <p>게시글이 없습니다.</p>
          {(filter.keyword || filter.author) && (
            <button className={styles.resetBtn} onClick={resetFilters}>
              전체 게시글 보기
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className={styles.postListUl}>
            {posts.map(post => (
              <li key={post.id} className={styles.postItem}>
                <div className={styles.postContent}>
                  <span
                    className={styles.postTitleLink}
                    onClick={() => navigate(`/board/free/${post.id}`)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/board/free/${post.id}`);
                      }
                    }}
                  >
                    {post.title}
                    {post.files_count > 0 && (
                      <span className={styles.attachmentIcon} title="첨부파일 있음">
                        📎
                      </span>
                    )}
                  </span>
                  
                  <div className={styles.postMeta}>
                    <span className={styles.postAuthor}>
                      {post.author_nickname || post.author}
                    </span>
                    <span className={styles.postDate}>
                      {new Date(post.created_at).toLocaleDateString('ko-KR', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <div className={styles.postStats}>
                      {typeof post.views === 'number' && (
                        <span className={styles.statItem}>
                          👀 {post.views}
                        </span>
                      )}
                      {typeof post.likes === 'number' && post.likes > 0 && (
                        <span className={styles.statItem}>
                          👍 {post.likes}
                        </span>
                      )}
                      {typeof post.comments_count === 'number' && post.comments_count > 0 && (
                        <span className={styles.statItem}>
                          💬 {post.comments_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        </>
      )}
    </div>
  );
}
