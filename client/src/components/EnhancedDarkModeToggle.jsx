import React from 'react';
import { useDarkMode } from '../../utils/useDarkMode';
import styles from '../../styles/EnhancedDarkModeToggle.module.scss';

function EnhancedDarkModeToggle() {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <div 
      className={`${styles.darkModeToggle} ${isDark ? styles.dark : ''}`}
      onClick={toggleDarkMode}
      title={isDark ? '라이트 모드로 변경' : '다크 모드로 변경'}
    >
      <span className={`${styles.icon} ${styles.sun}`}>☀️</span>
      <div className={styles.toggleSwitch}></div>
      <span className={`${styles.icon} ${styles.moon}`}>🌙</span>
    </div>
  );
}

export default EnhancedDarkModeToggle;

