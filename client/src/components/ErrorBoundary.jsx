import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/ErrorBoundary.module.scss';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // 에러 로깅 (실제 서비스에서는 에러 추적 서비스에 보냄)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      showDetails: false 
    });
  };

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorIcon}>💥</div>
          
          <h1 className={styles.errorTitle}>앗! 문제가 발생했어요</h1>
          
          <p className={styles.errorMessage}>
            예상치 못한 오류가 발생했습니다. 
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>

          <div className={styles.errorActions}>
            <button 
              className={styles.retryButton}
              onClick={this.handleRetry}
            >
              🔄 다시 시도
            </button>
            
            <Link to="/" className={styles.homeButton}>
              🏠 홈으로 가기
            </Link>
          </div>

          {/* 개발 모드에서만 에러 상세 정보 표시 */}
          {process.env.NODE_ENV === 'development' && (
            <div className={styles.errorDetails}>
              <button 
                className={styles.detailsToggle}
                onClick={this.toggleDetails}
              >
                {this.state.showDetails ? '상세 정보 숨기기' : '상세 정보 보기'}
              </button>
              
              {this.state.showDetails && (
                <>
                  <h3>Error: {this.state.error && this.state.error.toString()}</h3>
                  <div className={styles.stackTrace}>
                    {this.state.errorInfo.componentStack}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
