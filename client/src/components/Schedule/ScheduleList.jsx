// src/components/Schedule/ScheduleList.jsx
import { useEffect, useState } from 'react';
import styles from '../../styles/ScheduleList.module.scss';
import { useNavigate } from 'react-router-dom';

export default function ScheduleList({ refreshCount }) {
  const [schedules, setSchedules] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/schedules')
      .then(res => res.json())
      .then(setSchedules);
  }, [refreshCount]);

  return (
    <div className={styles.scheduleList}>
      <h3>공유 일정</h3>
      <ul>
        {schedules.map((s) => (
          <li
            className={styles.scheduleItem}
            key={s.id}
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/board/schedule/${s.id}`)}
          >
            {s.images && s.images.length > 0 && (
              <img src={s.images[0]} alt="썸네일" className={styles.thumb} />
            )}
            <div className={styles.title}>{s.title}</div>
            <div className={styles.meta}>
              날짜: {new Date(s.date).toLocaleDateString()}<br/>
              작성자: <b>{s.author ?? "알 수 없음"}</b>
            </div>
            <div className={styles.desc}>{s.desc}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
