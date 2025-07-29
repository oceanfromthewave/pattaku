import styles from '../styles/Loading.module.scss';

export default function Loading({ message = '로딩 중...' }) {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}>
        <div className={styles.spinnerInner}></div>
      </div>
      <p className={styles.loadingMessage}>{message}</p>
    </div>
  );
}
