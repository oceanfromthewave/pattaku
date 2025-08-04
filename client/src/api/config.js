// API 설정 - 완전 하드코딩 (환경변수 무시)
console.warn('🚨 강제 하드코딩된 API 설정 사용중');

// 프로덕션 URL로 강제 설정
const API_BASE_URL = "https://pattaku.onrender.com";
const UPLOADS_URL = "https://pattaku.onrender.com/uploads";  
const WS_URL = "https://pattaku.onrender.com"; // WebSocket URL (https로 변경)

// 빌드 시점 확인용 로그
console.log('📍 API 설정 확정:', { 
  API_BASE_URL, 
  UPLOADS_URL, 
  WS_URL,
  buildTime: new Date().toISOString()
});

export { API_BASE_URL, UPLOADS_URL, WS_URL };