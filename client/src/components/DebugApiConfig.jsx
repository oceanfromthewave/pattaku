// 디버깅용 컴포넌트 - API URL 확인
import React from 'react';
import { API_BASE_URL, UPLOADS_URL, WS_URL } from '../api/config';

const DebugApiConfig = () => {
  // 프로덕션에서도 일시적으로 보이도록 설정 (배포 후 확인용)
  const showDebug = import.meta.env.DEV || window.location.search.includes('debug=true');
  
  if (!showDebug) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      fontSize: '12px',
      borderRadius: '8px',
      zIndex: 9999,
      maxWidth: '400px',
      fontFamily: 'monospace',
      border: '2px solid #00ff00'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#00ff00' }}>
        🔧 API Config Debug:
      </div>
      <div>API: {API_BASE_URL}</div>
      <div>UPLOADS: {UPLOADS_URL}</div>
      <div>WS: {WS_URL}</div>
      <div>MODE: {import.meta.env.MODE}</div>
      <div>PROD: {import.meta.env.PROD ? 'true' : 'false'}</div>
      <div>DEV: {import.meta.env.DEV ? 'true' : 'false'}</div>
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#ccc' }}>
        프로덕션에서 보려면 URL에 ?debug=true 추가
      </div>
    </div>
  );
};

export default DebugApiConfig;
