// src/components/Schedule/ScheduleDetail.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { notifyError } from '../../utils/notify';
import ScheduleVoteBar from './ScheduleVoteBar';
import ScheduleCommentList from './ScheduleCommentList';
import styles from '../../styles/ScheduleDetail.module.scss';

export default function ScheduleDetail({ isLogin }) {
  const { id } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/schedules/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('일정 정보를 찾을 수 없습니다.');
        return res.json();
      })
      .then(data => setSchedule(data))
      .catch(err => {
        notifyError(err.message);
        setSchedule(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isAuthor = isLogin && schedule && schedule.author === username;

  if (loading) return <div className={styles['schedule-detail-wrap']}>불러오는 중...</div>;
  if (!schedule) return <div className={styles['schedule-detail-wrap']}>일정이 없습니다.</div>;

  return (
    <div className={styles['schedule-detail-wrap']}>
      <h2 className={styles['schedule-title']}>{schedule.title}</h2>
      <div className={styles['schedule-meta']}>
        날짜: {schedule.date ? new Date(schedule.date).toLocaleDateString() : "알 수 없음"} / 작성자: <b>{schedule.author ?? "알 수 없음"}</b>
      </div>
      <div className={styles['schedule-desc']}>{schedule.desc}</div>
      {/* 이미지 미리보기 */}
      {schedule.images && schedule.images.length > 0 && (
        <div className={styles.imgGroup}>
          {schedule.images.map((img, idx) => (
            <img key={idx} src={img} alt={`일정이미지${idx+1}`} className={styles.imgPreview} />
          ))}
        </div>
      )}
      <section className={styles['schedule-vote-section']}>
        <h3>참여 여부 투표</h3>
        <ScheduleVoteBar scheduleId={id} />
      </section>
      <section className={styles['schedule-comments-section']}>
        <h3>댓글</h3>
        <ScheduleCommentList scheduleId={id} isLogin={isLogin} currentUser={username} />
      </section>
      {isAuthor && (
        <div className={styles['schedule-detail-buttons']}>
          <button className={styles['btn-edit']} onClick={() => navigate(`/board/schedule/${id}/edit`)}>수정</button>
          <button className={styles['btn-delete']} /*onClick={handleDelete}*/>삭제</button>
        </div>
      )}
    </div>
  );
}
