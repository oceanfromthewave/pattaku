import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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

  // 이미지 슬라이더 상태
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

  // 작성자 여부 확인
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
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 이미지 URL 처리
  const getImageUrl = (img) => {
    if (!img) return '';
    return img.startsWith('http') ? img : `${UPLOADS_URL}/${img.replace(/^\/?uploads\/?/, '')}`;
  };

  // 이미지 네비게이션
  const handlePrevImage = () => setImgIdx(i => Math.max(i - 1, 0));
  const handleNextImage = () => setImgIdx(i => Math.min(i + 1, images.length - 1));
  const handleThumbClick = (idx) => setImgIdx(idx);

  const images = schedule?.images || [];

  if (loading) return <Loading message="일정을 불러오는 중..." />;

  if (!schedule) {
    return (
      <div className="page-container">
        <div className={styles.scheduleNotFound}>
          <h2>📅 일정을 찾을 수 없습니다</h2>
          <p>요청하신 일정이 존재하지 않거나 삭제되었습니다.</p>
          <button 
            className={`btn btn-primary ${styles.btnBack}`}
            onClick={() => navigate('/schedules')}
          >
            ← 일정 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className={styles.scheduleDetailWrap}>
        {/* 헤더 */}
        <div className={styles.scheduleHeader}>
          <h1 className={styles.scheduleTitle}>
            📅 {schedule.title}
          </h1>
          <div className={styles.scheduleMeta}>
            <div className={styles.metaItem}>
              <span className={styles.scheduleDate}>
                🗓️ {formatDate(schedule.created_at)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.scheduleAuthor}>
                👤 {schedule.author_nickname || schedule.author}
              </span>
                      {/* 수정/삭제 버튼 (작성자만) */}
        {isAuthor && (
          <div className={styles.scheduleDetailButtons}>
            <button 
              className={styles.btnEdit}
              onClick={() => navigate(`/schedules/${scheduleId}/edit`)}
              disabled={deleting}
            >
              ✏️ 수정
            </button>
            <button 
              className={styles.btnDelete}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '삭제 중...' : '🗑️ 삭제'}
            </button>
          </div>
        )}
            </div>
            {schedule.vote_count > 0 && (
              <div className={styles.metaItem}>
                <span className={styles.scheduleVotes}>
                  🗳️ {schedule.vote_count}명 참여
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 이미지 슬라이더 */}
        {images.length > 0 && (
          <div className={styles.scheduleImageSlider}>
            <div className={styles.imageContainer}>
              {images.length > 1 && (
                <button
                  disabled={imgIdx === 0}
                  onClick={handlePrevImage}
                  className={`${styles.sliderBtn} ${styles.prevBtn}`}
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
                  className={`${styles.sliderBtn} ${styles.nextBtn}`}
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
                    className={`${styles.thumbImg} ${idx === imgIdx ? styles.selected : ''}`}
                    onClick={() => handleThumbClick(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 일정 내용 */}
        {schedule.desc && (
          <div className={styles.scheduleContent}>
            <h3 className={styles.contentTitle}>📝 일정 설명</h3>
            <div className={styles.scheduleDesc}>
              {schedule.desc.split('\n').map((line, index) => (
                <p key={index}>{line || '\u00A0'}</p>
              ))}
            </div>
          </div>
        )}

        {/* 참여 여부 투표 */}
        <section className={styles.scheduleVoteSection}>
          <h3 className={styles.sectionTitle}>
            🗳️ 참여 여부 투표
          </h3>
          <ScheduleVoteBar scheduleId={scheduleId} isLogin={isLogin} showVoterList={true} />
        </section>

        {/* 댓글 */}
        <section className={styles.scheduleCommentsSection}>
          <h3 className={styles.sectionTitle}>
            💬 댓글
          </h3>
          <ScheduleCommentList scheduleId={scheduleId} isLogin={isLogin} currentUser={userId} type="schedule" />
        </section>


        
        {/* 뒤로가기 버튼 */}
        <div className={styles.scheduleBackButton}>
          <button 
            className={styles.btnBack}
            onClick={() => navigate('/schedules')}
          >
            ← 일정 목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
