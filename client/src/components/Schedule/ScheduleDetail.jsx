import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import classNames from 'classnames';
import { getScheduleById, deleteSchedule } from '../../api/scheduleApi';
import { notifyError, notifySuccess } from '../../utils/notify';
import ScheduleVoteBar from './ScheduleVoteBar';
import ScheduleCommentList from './ScheduleCommentList';
import Loading from '../Loading';
import { UPLOADS_URL } from '../../api/config';
import styles from '../../styles/ScheduleDetail.module.scss';

export default function ScheduleDetail({ isLogin }) {
  const { scheduleId } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const data = await getScheduleById(scheduleId);
        setSchedule(data);
      } catch (error) {
        console.error('일정 로드 오류:', error);
        notifyError('일정 정보를 찾을 수 없습니다.');
        setSchedule(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [scheduleId]);

  // 작성자 여부
  const isAuthor = isLogin && schedule && (
    String(schedule.user_id) === String(userId) || 
    schedule.author === username
  );

  // 삭제 처리
  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await deleteSchedule(scheduleId);
      notifySuccess('일정이 삭제되었습니다.');
      navigate('/schedules');
    } catch (error) {
      console.error('일정 삭제 오류:', error);
      notifyError('일정 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 일정 날짜 범위 텍스트
  let scheduleDateText = '';
  if (schedule?.start_date) {
    if (schedule?.end_date && schedule.end_date !== schedule.start_date) {
      scheduleDateText = `${formatDate(schedule.start_date)} ~ ${formatDate(schedule.end_date)}`;
    } else {
      scheduleDateText = formatDate(schedule.start_date);
    }
  } else {
    scheduleDateText = formatDate(schedule?.created_at);
  }

  // 이미지 URL
  const getImageUrl = (img) => {
    if (!img) return '';
    return img.startsWith('http') ? img : `${UPLOADS_URL}/${img.replace(/^\/?uploads\/?/, '')}`;
  };

  // 이미지 네비게이션
  const images = schedule?.images || [];
  const handlePrevImage = () => setImgIdx(i => Math.max(i - 1, 0));
  const handleNextImage = () => setImgIdx(i => Math.min(i + 1, images.length - 1));
  const handleThumbClick = (idx) => setImgIdx(idx);

  if (loading) return <Loading message="일정을 불러오는 중..." />;

  if (!schedule) {
    return (
      <div className={styles.scheduleDetailRoot}>
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📅</div>
            <h2>일정을 찾을 수 없습니다</h2>
            <p>요청하신 일정이 존재하지 않거나 삭제되었습니다.</p>
            <button 
              className={classNames('btn', styles.btnPrimary)}
              onClick={() => navigate('/schedules')}
            >
              ← 일정 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.scheduleDetailRoot}>
      {/* 메인 카드 */}
      <div className={styles.card}>
        {/* 헤더 */}
        <div className={styles.scheduleHeader}>
          {/* 썸네일/아바타/이니셜 */}
          <div className={styles.avatar}>
            {schedule.title?.charAt(0) || "📅"}
          </div>
          <div className={styles.scheduleTitle}>
            {schedule.title}
          </div>
          <div className={styles.author}>
            <span>👤</span>
            {schedule.author_nickname || schedule.author}
          </div>
        </div>

        {/* 액션 버튼 (작성자만) */}
        {isAuthor && (
          <div className={styles.scheduleActions}>
            <button 
              className={classNames('btn', styles.btnSecondary)}
              onClick={() => navigate(`/schedules/${scheduleId}/edit`)}
              disabled={deleting}
            >
              ✏️ 수정
            </button>
            <button 
              className={classNames('btn', styles.btnDanger)}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '삭제 중...' : '🗑️ 삭제'}
            </button>
          </div>
        )}

        <hr />

        {/* 이미지 슬라이더 */}
        {images.length > 0 && (
          <div className={styles.imageSlider}>
            <div className={styles.imageContainer}>
              {images.length > 1 && (
                <button
                  disabled={imgIdx === 0}
                  onClick={handlePrevImage}
                  className={classNames(styles.sliderBtn, styles.prevBtn)}
                  aria-label="이전 이미지"
                >
                  ◀
                </button>
              )}
              <img
                src={getImageUrl(images[imgIdx])}
                alt="일정 이미지"
                className={styles.mainImage}
              />
              {images.length > 1 && (
                <button
                  disabled={imgIdx === images.length - 1}
                  onClick={handleNextImage}
                  className={classNames(styles.sliderBtn, styles.nextBtn)}
                  aria-label="다음 이미지"
                >
                  ▶
                </button>
              )}
              {images.length > 1 && (
                <div className={styles.imageCounter}>
                  {imgIdx + 1} / {images.length}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className={styles.thumbList}>
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`썸네일 ${idx + 1}`}
                    className={classNames(styles.thumbImg, {
                      [styles.selected]: idx === imgIdx
                    })}
                    onClick={() => handleThumbClick(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 일정 설명 영역 */}
        <div className={styles.scheduleDescSection}>
          <div className={styles.sectionTitle}>
            <span role="img" aria-label="설명">📝</span> 일정 설명
          </div>
          <div className={styles.scheduleDateBox}>
            <strong>일정 날짜</strong>
            <span className={styles.dateText}>{scheduleDateText}</span>
          </div>
          <div className={styles.descCard}>
            <div className={styles.descTitle}>일정 내용</div>
            <div className={styles.descContent}>
              {schedule.desc ? (
                schedule.desc.split('\n').map((line, idx) => <p key={idx}>{line || '\u00A0'}</p>)
              ) : (
                <span className={styles.textSecondary}>내용이 없습니다.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 참여 투표 카드 */}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            🗳️ 참여 여부 투표
          </h3>
        </div>
        <ScheduleVoteBar scheduleId={scheduleId} isLogin={isLogin} showVoterList={true} />
      </div>

      {/* 댓글 카드 */}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            💬 댓글
          </h3>
        </div>
        <ScheduleCommentList scheduleId={scheduleId} isLogin={isLogin} currentUser={userId} type="schedule" />
      </div>

      {/* 뒤로가기 버튼 */}
      <div className={styles.backButtonContainer}>
        <button 
          className={classNames('btn', styles.btnOutline)}
          onClick={() => navigate('/schedules')}
        >
          ← 일정 목록으로
        </button>
      </div>
    </div>
  );
}
