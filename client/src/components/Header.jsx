import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationSystem from './Notifications/NotificationSystem';
import styles from '../styles/Header.module.scss';

function Header() {
  const { isLoggedIn, userInfo, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 다크모드 상태 확인
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      <header className={styles.appHeader}>
        <div className={styles.headerContent}>
          {/* 로고 */}
          <Link to="/" className={styles.logo} onClick={closeMobileMenu}>
            <div className={styles.logoIcon}>🍯</div>
            <span>Pattaku</span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className={styles.navMenu}>
            <Link 
              to="/" 
              className={`${styles.navLink} ${isActivePath('/') && location.pathname === '/' ? styles.active : ''}`}
            >
              🏠 홈
            </Link>
            <Link 
              to="/posts" 
              className={`${styles.navLink} ${isActivePath('/posts') ? styles.active : ''}`}
            >
              📝 게시글
            </Link>
            <Link 
              to="/schedules" 
              className={`${styles.navLink} ${isActivePath('/schedules') ? styles.active : ''}`}
            >
              📅 일정
            </Link>
          </nav>

          {/* 우측 메뉴 */}
          <div className={styles.userMenu}>
            {/* 다크모드 토글 */}
            <button 
              className={styles.themeToggleBtn}
              onClick={toggleDarkMode}
              title={isDarkMode ? '라이트 모드로 변경' : '다크 모드로 변경'}
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>

            {/* 알림 (로그인시에만) */}
            {isLoggedIn && (
              <NotificationSystem userId={userInfo?.id} />
            )}

            {/* 사용자 메뉴 */}
            {isLoggedIn ? (
              <div className={styles.userProfile}>
                <Link to="/mypage" className={styles.profileLink}>
                  <div className={styles.avatar}>
                    {userInfo?.nickname?.charAt(0) || '👤'}
                  </div>
                  <span className={styles.username}>{userInfo?.nickname || '사용자'}</span>
                </Link>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  🚪 로그아웃
                </button>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link to="/login" className={`${styles.btn} ${styles.btnOutline}`}>
                  🔑 로그인
                </Link>
                <Link to="/register" className={`${styles.btn} ${styles.btnPrimary}`}>
                  ✨ 회원가입
                </Link>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button 
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              aria-label="메뉴 열기"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 네비게이션 */}
      <nav className={`${styles.mobileNav} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileNavHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🍯</div>
            <span>Pattaku</span>
          </div>
          <button 
            className={styles.mobileCloseBtn}
            onClick={closeMobileMenu}
            aria-label="메뉴 닫기"
          >
            ✕
          </button>
        </div>

        <div className={styles.mobileNavLinks}>
          <Link 
            to="/" 
            className={styles.mobileNavLink}
            onClick={closeMobileMenu}
          >
            🏠 홈
          </Link>
          <Link 
            to="/posts" 
            className={styles.mobileNavLink}
            onClick={closeMobileMenu}
          >
            📝 게시글
          </Link>
          <Link 
            to="/schedules" 
            className={styles.mobileNavLink}
            onClick={closeMobileMenu}
          >
            📅 일정
          </Link>
          
          {isLoggedIn ? (
            <>
              <div className={styles.mobileDivider}></div>
              <Link 
                to="/mypage" 
                className={styles.mobileNavLink}
                onClick={closeMobileMenu}
              >
                👤 마이페이지
              </Link>
              <button 
                className={`${styles.mobileNavLink} ${styles.logout}`}
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
              >
                🚪 로그아웃
              </button>
            </>
          ) : (
            <>
              <div className={styles.mobileDivider}></div>
              <Link 
                to="/login" 
                className={styles.mobileNavLink}
                onClick={closeMobileMenu}
              >
                🔑 로그인
              </Link>
              <Link 
                to="/register" 
                className={styles.mobileNavLink}
                onClick={closeMobileMenu}
              >
                ✨ 회원가입
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 모바일 메뉴 오버레이 */}
      {mobileMenuOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={closeMobileMenu}
        ></div>
      )}
    </>
  );
}

export default Header;
