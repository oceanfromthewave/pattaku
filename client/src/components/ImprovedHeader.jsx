import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EnhancedDarkModeToggle from './EnhancedDarkModeToggle';
import styles from '../../styles/ImprovedHeader.module.scss';

function ImprovedHeader() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/">Pattaku</Link>
      </div>
      <nav className={styles.nav}>
        <Link to="/">홈</Link>
        <Link to="/posts">게시글</Link>
        <Link to="/schedules">스케줄</Link>
      </nav>
      <div className={styles.authButtons}>
        <EnhancedDarkModeToggle />
        {token ? (
          <>
            <button onClick={() => navigate('/mypage')} className={styles.myPageBtn}>
              마이페이지
            </button>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              로그아웃
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')} className={styles.loginBtn}>
            로그인
          </button>
        )}
      </div>
    </header>
  );
}

export default ImprovedHeader;

