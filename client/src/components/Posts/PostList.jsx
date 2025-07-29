import { useEffect, useState, useRef } from 'react';
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
  const [filter, setFilter] = useState({ q: '', author: '', sort: 'recent' });
  const [search, setSearch] = useState(''); // 제목/내용/태그 검색 input
  const [authorInput, setAuthorInput] = useState(''); // 작성자 검색 input
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  
  // 스크롤 위치 저장용 ref
  const scrollPositionRef = useRef(0);
  const containerRef = useRef(null);

  // 스크롤 위치 저장
  const saveScrollPosition = () => {
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
  };

  // 스크롤 위치 복원
  const restoreScrollPosition = () => {
    // 다음 렌더링 사이클에서 스크롤 복원
    setTimeout(() => {
      if (scrollPositionRef.current > 0) {
        window.scrollTo(0, scrollPositionRef.current);
      }
    }, 50);
  };

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
        setPosts(data.posts || data);
        setTotalPages(data.totalPages || Math.ceil((data.total || data.length) / itemsPerPage));
        setTotalItems(data.total || data.length);
      } catch (error) {
        console.error('게시글 로딩 실패:', error);
        notifyError('게시글을 불러오는데 실패했습니다.');
        setPosts([]);
      } finally {
        setLoading(false);
        // 로딩 완료 후 스크롤 위치 복원 (정렬 변경 시에만)
        if (scrollPositionRef.current > 0) {
          restoreScrollPosition();
        }
      }
    };
    fetchPosts();
  }, [refreshCount, filter, currentPage]);

  // 검색 실행 (제목/내용/태그/작성자 모두)
  const handleSearch = () => {
    // 검색 시에는 스크롤을 맨 위로
    scrollPositionRef.current = 0;
    setFilter(f => ({ ...f, q: search, author: authorInput }));
    setCurrentPage(1);
  };

  // 정렬 토글 (스크롤 위치 유지)
  const toggleSort = (e) => {
    e.preventDefault(); // 기본 동작 방지
    
    // 현재 스크롤 위치 저장
    saveScrollPosition();
    
    setFilter(f => ({
      ...f,
      sort: f.sort === 'recent' ? 'popular' : 'recent'
    }));
    setCurrentPage(1);
  };

  // 페이지 변경 (스크롤을 맨 위로)
  const handlePageChange = (page) => {
    scrollPositionRef.current = 0; // 페이지 변경 시에는 맨 위로
    setCurrentPage(page);
    // 부드러운 스크롤로 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 작성자 input 변경 (입력값만 변경)
  const handleAuthorChange = (e) => {
    setAuthorInput(e.target.value);
  };

  // 필터 초기화
  const resetFilters = () => {
    scrollPositionRef.current = 0; // 초기화 시에는 맨 위로
    setFilter({ q: '', author: '', sort: 'recent' });
    setSearch('');
    setAuthorInput('');
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Enter 키 핸들러
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  if (loading) return <Loading message="게시글을 불러오는 중..." />;

  return (
    <div className={classNames(styles.postList, 'postList')} ref={containerRef}>
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

      <div className={styles.searchBar}>
        <div className={styles.searchGroup}>
          <input
            type="text"
            placeholder="제목/내용/태그 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
            onKeyDown={e => handleKeyDown(e, handleSearch)}
          />
          <input
            type="text"
            placeholder="작성자"
            value={authorInput}
            onChange={handleAuthorChange}
            className={styles.searchInput}
            onKeyDown={e => handleKeyDown(e, handleSearch)}
          />
        </div>
        <div className={styles.controlGroup}>
          <button 
            type="button" 
            className={styles.searchBtn} 
            onClick={handleSearch}
          >
            검색
          </button>
          <button
            type="button"
            className={styles.sortBtn}
            onClick={toggleSort}
            title={`현재: ${filter.sort === 'recent' ? '최신순' : '인기순'}`}
          >
            {filter.sort === 'recent' ? '📅 최신순' : '👍 인기순'}
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className={styles.noPost}>
          <div className={styles.noPostIcon}>📝</div>
          <p>게시글이 없습니다.</p>
          {(filter.q || filter.author) && (
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