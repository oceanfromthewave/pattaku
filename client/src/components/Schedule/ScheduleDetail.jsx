import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getScheduleById, deleteSchedule } from '../../api/scheduleApi';
import { notifyError, notifySuccess } from '../../utils/notify';
import ScheduleVoteBar from './ScheduleVoteBar';
import ScheduleCommentList from './ScheduleCommentList';
import Loading from '../Loading';
import { UPLOADS_URL } from '../../api/config';
import styles from '../../styles/ScheduleDetail.module.scss';
import classNames from 'classnames';
import { formatDate } from '../../utils/data';

export default function ScheduleDetail({ isLogin }) {
  const { id } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const data = await getScheduleById(id);
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
  }, [id]);

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
      await deleteSchedule(id);
      notifySuccess('일정이 삭제되었습니다.');
      navigate('/board/schedule');
    } catch (error) {
      console.error('일정 삭제 오류:', error);
      notifyError('일정 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  // 이미지 슬라이더
  const [imgIdx, setImgIdx] = useState(0);
  const images = schedule?.images || [];

  // 이미지 URL을 절대주소로 변환
  const getImageUrl = (img) => {
    if (!img) return '';
    return img.startsWith('http') ? img : `${UPLOADS_URL}/${img.replace(/^\/?uploads\/?/, '')}`;
  };

  // 썸네일 클릭 시 메인 변경
  const handleThumbClick = (idx) => setImgIdx(idx);

  // 이미지 네비게이션
  const handlePrevImage = () => setImgIdx(i => Math.max(i - 1, 0));
  const handleNextImage = () => setImgIdx(i => Math.min(i + 1, images.length - 1));

  if (loading) return <Loading message="일정을 불러오는 중..." />;
  if (!schedule) {
    return (
      <div className={styles['schedule-detail-wrap']}>
        <div className={styles['schedule-not-found']}>
          <h2>📅 일정을 찾을 수 없습니다</h2>
          <p>요청하신 일정이 존재하지 않거나 삭제되었습니다.</p>
          <button 
            className={styles['btn-back']}
            onClick={() => navigate('/board/schedule')}
          >
            일정 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames(styles['schedule-detail-wrap'], 'schedule-detail-wrap')}>
      <div className={styles['schedule-header']}>
        <h1 className={styles['schedule-title']}>
          📅 {schedule.title}
        </h1>
        <div className={styles['schedule-meta']}>
          <span className={styles['schedule-date']}>
            📅 {formatDate(schedule.created_at)}
          </span>
          <span className={styles['schedule-author']}>
            👤 {schedule.author_nickname || schedule.author}
          </span>
          {schedule.vote_count > 0 && (
            <span className={styles['schedule-votes']}>
              🗳️ {schedule.vote_count}명 참여
            </span>
          )}
        </div>
      </div>

      {/* 이미지 슬라이더 */}
      {images.length > 0 && (
        <div className={styles['schedule-image-slider']}>
          <div className={styles['image-container']}>
            {images.length > 1 && (
              <button
                disabled={imgIdx === 0}
                onClick={handlePrevImage}
                className={classNames(styles['slider-btn'], styles['prev-btn'])}
                aria-label="이전 이미지"
              >
                ◀
              </button>
            )}
            
            <img
              src={getImageUrl(images[imgIdx])}
              alt="일정 이미지"
              className={styles['main-image']}
            />
            
            {images.length > 1 && (
              <button
                disabled={imgIdx === images.length - 1}
                onClick={handleNextImage}
                className={classNames(styles['slider-btn'], styles['next-btn'])}
                aria-label="다음 이미지"
              >
                ▶
              </button>
            )}
            
            {images.length > 1 && (
              <div className={styles['image-counter']}>
                {imgIdx + 1} / {images.length}
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className={styles['thumb-list']}>
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(img)}
                  alt={`썸네일 ${idx + 1}`}
                  className={classNames(
                    styles['thumb-img'], 
                    { [styles.selected]: idx === imgIdx }
                  )}
                  onClick={() => handleThumbClick(idx)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {schedule.desc && (
        <div className={styles['schedule-content']}>
          <h3 className={styles['content-title']}>📝 일정 설명</h3>
          <div className={styles['schedule-desc']}>
            {schedule.desc.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* 참여 여부 투표 + 투표자 리스트 */}
      <section className={styles['schedule-vote-section']}>
        <h3 className={styles['section-title']}>
          🗳️ 참여 여부 투표
        </h3>
        <ScheduleVoteBar scheduleId={id} isLogin={isLogin} showVoterList={true} />
      </section>

      {/* 댓글 */}
      <section className={styles['schedule-comments-section']}>
        <ScheduleCommentList scheduleId={id} isLogin={isLogin} currentUser={userId} type="schedule" />
      </section>

      {/* 수정/삭제 버튼 (작성자만) */}
      {isAuthor && (
        <div className={styles['schedule-detail-buttons']}>
          <button 
            className={styles['btn-edit']} 
            onClick={() => navigate(`/board/schedule/${id}/edit`)}
            disabled={deleting}
          >
            ✏️ 수정
          </button>
          <button 
            className={styles['btn-delete']} 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? '삭제 중...' : '🗑️ 삭제'}
          </button>
        </div>
      )}
      
      <div className={styles['schedule-back-button']}>
        <button 
          className={styles['btn-back']}
          onClick={() => navigate('/board/schedule')}
        >
          ← 일정 목록으로
        </button>
      </div>
    </div>
  );
}
