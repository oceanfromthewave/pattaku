import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import styles from '../../styles/ScheduleList.module.scss';

export default function ScheduleList({ refreshCount }) {
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/schedules')
      .then(res => res.json())
      .then(setSchedules);
  }, [refreshCount]);

  // 검색·정렬
  const filtered = schedules
    .filter(s =>
      (!search || s.title.includes(search) || (s.desc && s.desc.includes(search)))
    )
    .sort((a, b) => {
      if (sort === 'recent') return new Date(b.date) - new Date(a.date);
      if (sort === 'old') return new Date(a.date) - new Date(b.date);
      return 0;
    });

  return (
    <div className={classNames(styles.scheduleList, 'scheduleList')}>
      <div className={styles.listTopBar}>
        <h3>공유 일정</h3>
        <div className={styles.filterBar}>
          <input
            type="text"
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="제목/설명 검색"
          />
          <button
            type="button"
            className={styles.sortBtn}
            onClick={() => setSort(s => (s === 'recent' ? 'old' : 'recent'))}
          >
            {sort === 'recent' ? '최신순' : '과거순'}
          </button>
        </div>
      </div>
      <ul className={styles.scheduleUl}>
        {filtered.map((s) => (
          <li
            className={styles.scheduleItem}
            key={s.id}
            tabIndex={0}
            role="button"
            aria-label={s.title}
            onClick={() => navigate(`/board/schedule/${s.id}`)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/board/schedule/${s.id}`)}
          >
            {s.images && s.images.length > 0 && (
              <div className={styles.imgThumbWrap}>
                <img src={s.images[0]} alt="일정 썸네일" className={styles.imgThumb} />
              </div>
            )}
            <div className={styles.infoWrap}>
              <div className={styles.title}>{s.title}</div>
              <div className={styles.meta}>
                날짜: {s.date}
                &nbsp;/&nbsp;작성자: <b>{s.author_nickname || s.author}</b>
              </div>
              <div className={styles.desc}>{s.desc?.length > 60 ? s.desc.slice(0, 60) + '…' : s.desc}</div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className={styles.noData}>일정이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
