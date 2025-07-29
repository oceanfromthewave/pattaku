import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { getSchedules } from '../../api/scheduleApi';
import { notifyError } from '../../utils/notify';
import { formatDate } from '../../utils/data';
import Loading from '../Loading';
import Pagination from '../Pagination';
import styles from '../../styles/ScheduleList.module.scss';

export default function ScheduleList({ refreshCount }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(''); // 실제 검색어
  const [searchInput, setSearchInput] = useState(''); // 입력창 값
  const [sort, setSort] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  // 스크롤 위치 저장용 ref
  const scrollPositionRef = useRef(0);

  // 스크롤 위치 저장
  const saveScrollPosition = () => {
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
  };

  // 스크롤 위치 복원
  const restoreScrollPosition = () => {
    setTimeout(() => {
      if (scrollPositionRef.current > 0) {
        window.scrollTo(0, scrollPositionRef.current);
      }
    }, 50);
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          search,
          sort
        };
        const data = await getSchedules(params);
        setSchedules(data.schedules || data);
        setTotalPages(data.totalPages || Math.ceil((data.total || data.length) / itemsPerPage));
        setTotalItems(data.total || data.length);
      } catch (error) {
        console.error('스케줄 로딩 실패:', error);
        notifyError('스케줄을 불러오는데 실패했습니다.');
        setSchedules([]);
      } finally {
        setLoading(false);
        // 로딩 완료 후 스크롤 위치 복원 (정렬 변경 시에만)
        if (scrollPositionRef.current > 0) {
          restoreScrollPosition();
        }
      }
    };
    fetchSchedules();
  }, [refreshCount, search, sort, currentPage]);

  // 디바운스: 입력 후 400ms 뒤에만 실제 검색 실행
  useEffect(() => {
    const handler = setTimeout(() => {
      // 검색 시에는 스크롤을 맨 위로
      if (searchInput !== search) {
        scrollPositionRef.current = 0;
      }
      setSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line
  }, [searchInput]);

  // 입력창 값만 변경
  const handleSearchInput = (value) => {
    setSearchInput(value);
  };

  // 정렬 변경 (스크롤 위치 유지)
  const handleSortChange = (e) => {
    e.preventDefault(); // 기본 동작 방지
    
    // 현재 스크롤 위치 저장
    saveScrollPosition();
    
    setSort(s => (s === 'recent' ? 'old' : 'recent'));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    scrollPositionRef.current = 0; // 초기화 시에는 맨 위로
    setSearchInput('');
    setSearch('');
    setSort('recent');
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (page) => {
    scrollPositionRef.current = 0; // 페이지 변경 시에는 맨 위로
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <Loading message="스케줄을 불러오는 중..." />;

  return (
    <div className={classNames(styles.scheduleList, 'scheduleList')}>
      <div className={styles.listHeader}>
        <h3 className={styles.listTitle}>📅 일정 공유</h3>
        <button 
          className={styles.resetBtn}
          onClick={resetFilters}
          title="필터 초기화"
        >
          초기화
        </button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchGroup}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="제목/설명 검색"
          />
        </div>
        <div className={styles.controlGroup}>
          <button
            type="button"
            className={styles.sortBtn}
            onClick={handleSortChange}
            title={`현재: ${sort === 'recent' ? '최신순' : '과거순'}`}
          >
            {sort === 'recent' ? '📅 최신순' : '🕰️ 과거순'}
          </button>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className={styles.noData}>
          <div className={styles.noDataIcon}>📅</div>
          <p>일정이 없습니다.</p>
          {search && (
            <button className={styles.resetBtn} onClick={resetFilters}>
              전체 일정 보기
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className={styles.scheduleUl}>
            {schedules.map((s) => (
              <li
                className={styles.scheduleItem}
                key={s.id}
                tabIndex={0}
                role="button"
                aria-label={s.title}
                onClick={() => navigate(`/board/schedule/${s.id}`)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/board/schedule/${s.id}`)}
              >
                <div className={styles.itemContent}>
                  {s.images && s.images.length > 0 && (
                    <div className={styles.imgThumbWrap}>
                      <img src={s.images[0]} alt="일정 썸네일" className={styles.imgThumb} />
                      {s.images.length > 1 && (
                        <div className={styles.imageCount}>
                          +{s.images.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={styles.infoWrap}>
                    <div className={styles.title}>{s.title}</div>
                    <div className={styles.meta}>
                      <span className={styles.date}>
                        📅 {formatDate(s.created_at)}
                      </span>
                      <span className={styles.author}>
                        👤 {s.author_nickname || s.author}
                      </span>
                      {s.vote_count > 0 && (
                        <span className={styles.voteCount}>
                          🗳️ {s.vote_count}
                        </span>
                      )}
                    </div>
                    <div className={styles.desc}>
                      {s.desc?.length > 80 ? s.desc.slice(0, 80) + '…' : s.desc}
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