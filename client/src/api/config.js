// src/api/apiConfig.js
// 임시로 하드코딩하여 테스트
const API_BASE_URL = "https://pattaku.onrender.com";
const UPLOADS_URL = "https://pattaku.onrender.com/uploads";
const WS_URL = "wss://pattaku.onrender.com";

// 원래 코드 (문제 해결 후 복원)
// const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || "http://localhost:5000/uploads";
// const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000";

console.log('API 설정:', { API_BASE_URL, UPLOADS_URL, WS_URL });

export { API_BASE_URL, UPLOADS_URL, WS_URL };
