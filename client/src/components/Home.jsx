import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Home.module.scss';
import logo from '../assets/pattaku-transparent.png';

function Home() {
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

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>📊 커뮤니티 현황</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>150+</span>
              <span className={styles.statLabel}>게시글</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>50+</span>
              <span className={styles.statLabel}>일정</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>200+</span>
              <span className={styles.statLabel}>댓글</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>30+</span>
              <span className={styles.statLabel}>활성 사용자</span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>🚀 빠른 시작</h2>
          <div className={styles.actionGrid}>
            <Link to="/posts/new" className={styles.actionCard}>
              <span className={styles.actionIcon}>✏️</span>
              <h3 className={styles.actionTitle}>첫 게시글 작성</h3>
              <p className={styles.actionDescription}>
                지금 바로 첫 게시글을 작성해보세요
              </p>
            </Link>
            
            <Link to="/schedules/new" className={styles.actionCard}>
              <span className={styles.actionIcon}>📋</span>
              <h3 className={styles.actionTitle}>일정 등록</h3>
              <p className={styles.actionDescription}>
                새로운 모임 일정을 등록해보세요
              </p>
            </Link>
            
            <Link to="/register" className={styles.actionCard}>
              <span className={styles.actionIcon}>🎉</span>
              <h3 className={styles.actionTitle}>회원가입</h3>
              <p className={styles.actionDescription}>
                아직 회원이 아니신가요? 지금 가입하세요
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
