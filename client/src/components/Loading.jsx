import React from 'react';
import styles from '../styles/Loading.module.scss';

function Loading({ message = '로딩 중...', type = 'spinner' }) {
  const renderLoading = () => {
    switch (type) {
      case 'dots':
        return (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingDots}>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
            <p className={styles.loadingText}>{message}</p>
          </div>
        );
      
      case 'overlay':
        return (
          <div className={styles.loadingOverlay}>
            <div className={styles.overlayContent}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>{message}</p>
            </div>
          </div>
        );
      
      case 'inline':
        return (
          <div className={styles.inlineLoading}>
            <div className={styles.spinner}></div>
            <span>{message}</span>
          </div>
        );
      
      default: // 'spinner'
        return (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>{message}</p>
          </div>
        );
    }
  };

  return renderLoading();
}

// 스켈레톤 로딩 컴포넌트
export function SkeletonLoader({ type = 'text', count = 1 }) {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div key={index} className={`${styles.skeleton} ${styles[`skeleton${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}></div>
  ));

  return <div>{skeletons}</div>;
}

export default Loading;
