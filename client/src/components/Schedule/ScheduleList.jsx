import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { useAuth } from '../../contexts/AuthContext';
import { getSchedules } from '../../api/scheduleApi';
import { notifyError, notifyWarning } from '../../utils/notify';
import { formatDate } from '../../utils/data';
import Loading from '../Loading';
import Pagination from '../Pagination';
import styles from '../../styles/ScheduleList.module.scss';

export default function ScheduleList({ refreshCount }) {
  const { isLoggedIn } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  // 스크롤 위치 저장용 ref
  const scrollPositionRef = useRef(0);

  // 로그인 체크 후 네비게이션
  const handleScheduleClick = (scheduleId) => {
    if (isLoggedIn) {
      navigate(`/schedules/${scheduleId}`);
    } else {
      notifyWarning('일정 상세보기는 로그인 후 이용 가능합니다.');
      setTimeout(() => {
        navigate('/register');
      }, 1500);
    }
  };

  // 새 일정 등록 버튼 체크
  const handleNewScheduleClick = () => {
    if (isLoggedIn) {
      navigate('/schedules/new');
    } else {
      notifyWarning('일정 등록은 로그인 후 이용 가능합니다.');
      setTimeout(() => {
        navigate('/register');
      }, 1500);
    }
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          search,
          sort,
        };
        const data = await getSchedules(params);
        setSchedules(data.schedules || data);
        setTotalPages(data.totalPages || Math.ceil((data.total || data.length) / itemsPerPage));
        setTotalItems(data.total || data.length);
      } catch (error) {
        notifyError('스케줄을 불러오는데 실패했습니다.');
        setSchedules([]);
      } finally {
        setLoading(false);
        if (scrollPositionRef.current > 0) {
          setTimeout(() => {
            window.scrollTo(0, scrollPositionRef.current);
          }, 50);
        }
      }
    };
    fetchSchedules();
    // eslint-disable-next-line
  }, [refreshCount, search, sort, currentPage]);

  // 검색 입력 디바운스
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) scrollPositionRef.current = 0;
      setSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line
  }, [searchInput]);

  const handleSearchInput = (value) => setSearchInput(value);

  const handleSortChange = (e) => {
    e.preventDefault();
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    setSort((s) => (s === 'recent' ? 'old' : 'recent'));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    scrollPositionRef.current = 0;
    setSearchInput('');
    setSearch('');
    setSort('recent');
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (page) => {
    scrollPositionRef.current = 0;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <Loading message="스케줄을 불러오는 중..." />;

  return (
    <div className={styles.scheduleListRoot}>
      {/* 페이지 헤더 */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📅 일정 공유</h1>
        <p className={styles.pageSubtitle}>함께 참여할 일정을 공유하고 소통해보세요</p>
      </div>

      {/* 검색/필터 카드 */}
      <div className={styles.scheduleFilters}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="search">검색</label>
            <input
              id="search"
              type="text"
              className={styles.searchInput}
              value={searchInput}
              onChange={e => handleSearchInput(e.target.value)}
              placeholder="제목/설명 검색"
            />
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="sort">정렬</label>
            <select
              id="sort"
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="recent">최신순</option>
              <option value="old">과거순</option>
            </select>
          </div>
        </div>
        
        <div className={styles.filterActions}>
          <button 
            className={classNames('btn', styles.btnSecondary)}
            onClick={resetFilters}
          >
            초기화
          </button>
          <button 
            className={classNames('btn', styles.btnPrimary)}
            onClick={handleNewScheduleClick}
          >
            📅 새 일정 등록
          </button>
        </div>
      </div>

      {/* 일정 목록 */}
      {schedules.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📅</div>
          <h3>일정이 없습니다</h3>
          <p>아직 등록된 일정이 없습니다.</p>
          {search && (
            <button 
              className={classNames('btn', styles.btnOutline)} 
              onClick={resetFilters}
            >
              전체 일정 보기
            </button>
          )}
        </div>
      ) : (
        <div className={styles.scheduleList}>
          {schedules.map((schedule) => (
            <div
              className={styles.scheduleCard}
              key={schedule.id}
              tabIndex={0}
              role="button"
              aria-label={schedule.title}
              onClick={() => handleScheduleClick(schedule.id)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleScheduleClick(schedule.id)}
            >
              {/* 썸네일 이미지 */}
              {schedule.images && schedule.images.length > 0 && (
                <div className={styles.cardImage}>
                  <img 
                    src={schedule.images[0]} 
                    alt="일정 썸네일" 
                    className={styles.thumbnailImg} 
                  />
                  {schedule.images.length > 1 && (
                    <div className={styles.imageCount}>
                      +{schedule.images.length - 1}
                    </div>
                  )}
                </div>
              )}
              
              {/* 카드 내용 */}
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.scheduleTitle}>{schedule.title}</h3>
                  <div className={styles.scheduleMeta}>
                    <span className={styles.scheduleDate}>
                      📅 {formatDate(schedule.created_at)}
                    </span>
                    <span className={styles.scheduleAuthor}>
                      👤 {schedule.author_nickname || schedule.author}
                    </span>
                    {schedule.vote_count > 0 && (
                      <span className={styles.voteCount}>
                        🗳️ {schedule.vote_count}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 설명 */}
                {schedule.desc && (
                  <div className={styles.scheduleExcerpt}>
                    {schedule.desc.length > 80 ? schedule.desc.slice(0, 80) + '…' : schedule.desc}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}
