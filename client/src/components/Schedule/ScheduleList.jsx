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
    <div ScheduleRoot>
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
        <input
          type="text"
          className={styles.searchInput}
          value={searchInput}
          onChange={e => handleSearchInput(e.target.value)}
          placeholder="제목/설명 검색"
        />
        <button
          type="button"
          className={styles.sortBtn}
          onClick={handleSortChange}
          title={`현재: ${sort === 'recent' ? '최신순' : '과거순'}`}
        >
          {sort === 'recent' ? '📅 최신순' : '🕰️ 과거순'}
        </button>
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
                onClick={() => navigate(`/schedules/${s.id}`)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/schedules/${s.id}`)}
              >
                <div className={styles.itemContent}>
                  {s.images && s.images.length > 0 && (
                    <div className={styles.imgThumbWrap}>
                      <img src={s.images[0]} alt="일정 썸네일" className={styles.imgThumb} />
                      {s.images.length > 1 && (
                        <div className={styles.imageCount}>+{s.images.length - 1}</div>
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
</div>
  );
}
