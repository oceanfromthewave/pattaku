import React from 'react';
import styles from '../styles/TokenExpiredModal.module.scss';

function TokenExpiredModal({ isOpen, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.warningIcon}>⚠️</div>
          <h2>로그인 세션 만료</h2>
        </div>
        
        <div className={styles.modalBody}>
          <p>로그인 세션이 만료되었습니다.</p>
          <p>다시 로그인해주세요.</p>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.confirmBtn}
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default TokenExpiredModal;
