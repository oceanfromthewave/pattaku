import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatSocket } from '../contexts/ChatContext';
import { API_BASE_URL } from '../api/config';

export default function DevStatusDashboard() {
  const [serverHealth, setServerHealth] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const { isLoggedIn, userInfo } = useAuth();
  const { isConnected, isAuthenticated } = useChatSocket();

  useEffect(() => {
    if (showDashboard) {
      fetchServerHealth();
      const interval = setInterval(fetchServerHealth, 5000);
      return () => clearInterval(interval);
    }
  }, [showDashboard]);

  const fetchServerHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setServerHealth(data);
    } catch (error) {
      setServerHealth({ status: 'ERROR', error: error.message });
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

  return (
    <>
      {/* Toggle Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#007bff',
          color: 'white',
          padding: '10px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '14px',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
        onClick={toggleDashboard}
        title="개발자 도구"
      >
        🛠️
      </div>

      {/* Dashboard Panel */}
      {showDashboard && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            width: '300px',
            fontSize: '12px',
            zIndex: 9998,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxHeight: '400px',
            overflow: 'auto'
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>개발 상태</h4>
          
          {/* Frontend Status */}
          <div style={{ marginBottom: '10px' }}>
            <strong>Frontend:</strong>
            <div>• 로그인: {isLoggedIn ? '✅' : '❌'}</div>
            <div>• 사용자: {userInfo?.nickname || 'N/A'}</div>
            <div>• Socket 연결: {isConnected ? '✅' : '❌'}</div>
            <div>• Socket 인증: {isAuthenticated ? '✅' : '❌'}</div>
          </div>

          {/* Backend Status */}
          <div style={{ marginBottom: '10px' }}>
            <strong>Backend:</strong>
            {serverHealth ? (
              <div>
                <div>• 상태: {serverHealth.status === 'OK' ? '✅' : '❌'}</div>
                {serverHealth.memory && (
                  <>
                    <div>• 메모리: {serverHealth.memory.heapUsed}</div>
                    <div>• 연결수: {serverHealth.connections}</div>
                    <div>• 업타임: {Math.floor(serverHealth.uptime)}초</div>
                  </>
                )}
                {serverHealth.error && (
                  <div style={{ color: 'red' }}>• 오류: {serverHealth.error}</div>
                )}
              </div>
            ) : (
              <div>• 로딩 중...</div>
            )}
          </div>

          {/* Environment Info */}
          <div style={{ marginBottom: '10px' }}>
            <strong>환경:</strong>
            <div>• 모드: {process.env.NODE_ENV || 'development'}</div>
            <div>• API URL: {API_BASE_URL}</div>
            <div>• 호스트: {window.location.hostname}</div>
          </div>

          {/* Quick Actions */}
          <div>
            <strong>빠른 작업:</strong>
            <div style={{ marginTop: '5px' }}>
              <button
                onClick={() => window.open(`${API_BASE_URL}/health`, '_blank')}
                style={{
                  padding: '2px 8px',
                  margin: '2px',
                  fontSize: '11px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                서버 상태
              </button>
              <button
                onClick={() => localStorage.clear()}
                style={{
                  padding: '2px 8px',
                  margin: '2px',
                  fontSize: '11px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                로컬 스토리지 지우기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}