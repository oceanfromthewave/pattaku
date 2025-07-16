// ScheduleList.jsx
import { useEffect, useState } from 'react';
import styles from '../../styles/ScheduleList.module.scss';

export default function ScheduleList({ refreshCount }) {
  const [schedules, setSchedules] = useState([]);

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
          <li className={styles.scheduleItem} key={s.id}>
            <div className={styles.title}>{s.title}</div>
            <div className={styles.meta}>
              날짜: {new Date(s.date).toLocaleDateString()}
            </div>
            <div className={styles.desc}>{s.desc}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
