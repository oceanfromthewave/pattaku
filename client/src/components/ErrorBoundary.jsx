import { Component } from 'react';
import styles from '../styles/ErrorBoundary.module.scss';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <h2 className={styles.errorTitle}>⚠️ 오류가 발생했습니다</h2>
            <p className={styles.errorMessage}>
              페이지를 불러오는 중 문제가 발생했습니다.
            </p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              페이지 새로고침
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className={styles.errorDetails}>
                <summary>오류 상세 정보</summary>
                <pre>{this.state.error?.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
