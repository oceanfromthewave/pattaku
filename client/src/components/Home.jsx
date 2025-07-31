import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notifyWarning } from '../utils/notify';
import styles from '../styles/Home.module.scss';

function Home() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // 로그인 체크 후 페이지 이동 또는 회원가입 유도
  const handleProtectedNavigation = (targetPath, actionName) => {
    if (isLoggedIn) {
      navigate(targetPath);
    } else {
      notifyWarning(`${actionName}은 로그인 후 이용 가능합니다.`);
      setTimeout(() => {
        navigate('/login');
      }, 1500); // 1.5초 후 회원가입 페이지로 이동
    }
  };

  // 버튼 클릭 핸들러
  const handleNewPostClick = (e) => {
    e.preventDefault();
    handleProtectedNavigation('/posts/new', '게시글 작성');
  };

  const handleNewScheduleClick = (e) => {
    e.preventDefault();
    handleProtectedNavigation('/schedules/new', '일정 등록');
  };
  return (
    <div className={styles.homeRoot}>
      <div className={styles.homeContainer}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <h1 className={styles.heroTitle}>🍯 Pattaku에 오신 것을 환영합니다!</h1>
          <p className={styles.heroSubtitle}>
            함께 소통하고, 일정을 공유하며, 추억을 만들어가는 커뮤니티 공간입니다.
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/posts" className={`${styles.ctaButton} ${styles.primary}`}>
              📝 게시글 보기
            </Link>
            <Link to="/schedules" className={`${styles.ctaButton} ${styles.secondary}`}>
              📅 일정 확인하기
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>✨ 주요 기능</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>📝</span>
              <h3 className={styles.featureTitle}>게시글 작성</h3>
              <p className={styles.featureDescription}>
                자유롭게 생각과 경험을 공유하고, 다른 사람들과 소통해보세요.
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>📅</span>
              <h3 className={styles.featureTitle}>일정 관리</h3>
              <p className={styles.featureDescription}>
                모임 일정을 등록하고 참석 여부를 투표로 결정할 수 있습니다.
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>💬</span>
              <h3 className={styles.featureTitle}>실시간 댓글</h3>
              <p className={styles.featureDescription}>
                게시글과 일정에 댓글을 달고 활발한 토론을 나누세요.
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🌙</span>
              <h3 className={styles.featureTitle}>다크모드</h3>
              <p className={styles.featureDescription}>
                눈에 편안한 다크모드로 언제든지 테마를 변경할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>🚀 빠른 시작</h2>
          <div className={styles.actionGrid}>
            <button onClick={handleNewPostClick} className={styles.actionCard}>
              <span className={styles.actionIcon}>✏️</span>
              <h3 className={styles.actionTitle}>첫 게시글 작성</h3>
              <p className={styles.actionDescription}>
                {isLoggedIn 
                  ? '지금 바로 첫 게시글을 작성해보세요' 
                  : '회원가입 후 게시글을 작성해보세요'
                }
              </p>
            </button>
            
            <button onClick={handleNewScheduleClick} className={styles.actionCard}>
              <span className={styles.actionIcon}>📋</span>
              <h3 className={styles.actionTitle}>일정 등록</h3>
              <p className={styles.actionDescription}>
                {isLoggedIn 
                  ? '새로운 모임 일정을 등록해보세요' 
                  : '회원가입 후 일정을 등록해보세요'
                }
              </p>
            </button>
            
            {!isLoggedIn && (
              <Link to="/register" className={styles.actionCard}>
                <span className={styles.actionIcon}>🎉</span>
                <h3 className={styles.actionTitle}>회원가입</h3>
                <p className={styles.actionDescription}>
                  아직 회원이 아니신가요? 지금 가입하세요
                </p>
              </Link>
            )}
            
            {isLoggedIn && (
              <Link to="/mypage" className={styles.actionCard}>
                <span className={styles.actionIcon}>👤</span>
                <h3 className={styles.actionTitle}>마이페이지</h3>
                <p className={styles.actionDescription}>
                  내 정보와 작성한 컨텐츠를 확인해보세요
                </p>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
