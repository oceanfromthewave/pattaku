// api/config.js - 개선된 API 설정
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 환경별 API URL 설정
const getApiConfig = () => {
  // 개발 환경
  if (isDevelopment || isLocalHost) {
    return {
      API_BASE_URL: "http://localhost:5000",
      UPLOADS_URL: "http://localhost:5000/uploads",
      WS_URL: "http://localhost:5000"
    };
  }

  // 프로덕션 환경
  return {
    API_BASE_URL: "https://pattaku.onrender.com",
    UPLOADS_URL: "https://pattaku.onrender.com/uploads",
    WS_URL: "https://pattaku.onrender.com"
  };
};

const config = getApiConfig();

// 환경변수 오버라이드 (있는 경우)
export const API_BASE_URL = import.meta.env.VITE_API_URL || config.API_BASE_URL;
export const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || config.UPLOADS_URL;
export const WS_URL = import.meta.env.VITE_WS_URL || config.WS_URL;

// 로깅
console.log('🌐 API 설정:', {
  API_BASE_URL,
  UPLOADS_URL,
  WS_URL,
  environment: isDevelopment ? 'development' : 'production',
  hostname: window.location.hostname
});

// API 응답 인터셉터용 기본 설정
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...DEFAULT_HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API 에러 처리 헬퍼
export const handleApiError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  
  const message = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
  console.error('API 오류:', message);
  return message;
};

// API 요청 래퍼
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: getAuthHeaders(),
      ...options,
      ...(options.body && typeof options.body === 'object' && {
        body: JSON.stringify(options.body)
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
