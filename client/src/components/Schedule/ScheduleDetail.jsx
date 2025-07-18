import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { notifyError } from '../../utils/notify';
import ScheduleVoteBar from './ScheduleVoteBar';
import ScheduleCommentList from './ScheduleCommentList';
import styles from '../../styles/ScheduleDetail.module.scss';
import classNames from 'classnames';

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

  // (작성자만 노출) 수정/삭제 기능
  const isAuthor = isLogin && schedule && schedule.author === username;

  // 이미지 슬라이더
  const [imgIdx, setImgIdx] = useState(0);
  const images = schedule?.images || [];

  // 썸네일 클릭 시 메인 변경
  const handleThumbClick = (idx) => setImgIdx(idx);

  if (loading) return <div className={styles['schedule-detail-wrap']}>불러오는 중...</div>;
  if (!schedule) return <div className={styles['schedule-detail-wrap']}>일정이 없습니다.</div>;

  return (
    <div className={classNames(styles['schedule-detail-wrap'], 'schedule-detail-wrap')}>
      <h2 className={styles['schedule-title']}>{schedule.title}</h2>
      <div className={styles['schedule-meta']}>
        날짜: {schedule.date}
        &nbsp;/&nbsp;작성자: <b>{schedule.author_nickname || schedule.author}</b>
      </div>

      {/* 이미지 슬라이더 */}
      {images.length > 0 && (
        <div className={styles['schedule-image-slider']}>
          <button
            disabled={imgIdx === 0}
            onClick={() => setImgIdx(i => Math.max(i - 1, 0))}
            className={styles['slider-btn']}
            aria-label="이전"
          >◀</button>
          <img
            src={images[imgIdx]}
            alt="일정 이미지"
            className={styles['main-image']}
          />
          <button
            disabled={imgIdx === images.length - 1}
            onClick={() => setImgIdx(i => Math.min(i + 1, images.length - 1))}
            className={styles['slider-btn']}
            aria-label="다음"
          >▶</button>
          <div className={styles['thumb-list']}>
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`썸네일${idx + 1}`}
                className={classNames(styles['thumb-img'], { [styles.selected]: idx === imgIdx })}
                onClick={() => handleThumbClick(idx)}
              />
            ))}
          </div>
        </div>
      )}

      {schedule.desc && (
        <div className={styles['schedule-desc']}>{schedule.desc}</div>
      )}

      {/* 참여 여부 투표 + 투표자 리스트 */}
      <section className={styles['schedule-vote-section']}>
        <h3>참여 여부 투표</h3>
        <ScheduleVoteBar scheduleId={id} showVoterList={true} />
      </section>

      {/* 댓글 */}
      <section className={styles['schedule-comments-section']}>
        <h3>댓글</h3>
        <ScheduleCommentList scheduleId={id} isLogin={isLogin} currentUser={username} type="schedule" />
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
