// API 설정 - 환경변수를 우선으로 사용, 없으면 Render URL 사용
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://pattaku.onrender.com";
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || "https://pattaku.onrender.com/uploads";
const WS_URL = import.meta.env.VITE_WS_URL || "wss://pattaku.onrender.com";

// 개발환경에서만 콘솔 로그 출력
if (import.meta.env.DEV) {
  console.log('API 설정:', { 
    API_BASE_URL, 
    UPLOADS_URL, 
    WS_URL,
    ENV_MODE: import.meta.env.MODE,
    ENV_VARS: {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_UPLOADS_URL: import.meta.env.VITE_UPLOADS_URL,
      VITE_WS_URL: import.meta.env.VITE_WS_URL
    }
  });
}

export { API_BASE_URL, UPLOADS_URL, WS_URL };
