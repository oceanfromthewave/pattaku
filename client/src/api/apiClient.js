import axios from 'axios';

// 🚨 EMERGENCY FIX - 절대 S3 URL 사용 금지
function getApiUrl() {
  const currentHost = window.location.hostname;
  
  // 개발 환경
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // 프로덕션 환경 - 무조건 Render 사용
  return 'https://pattaku.onrender.com';
}

const API_BASE_URL = getApiUrl();

// 강제 확인 로그
console.log('🔥 EMERGENCY API CLIENT LOADED');
console.log('🌍 Current hostname:', window.location.hostname);
console.log('🎯 API Base URL:', API_BASE_URL);
console.log('🚫 S3 usage BLOCKED');

// S3 URL 사용 시 강제 차단
if (API_BASE_URL.includes('s3-website')) {
  console.error('🚨 CRITICAL ERROR: S3 URL detected! Forcing Render URL...');
  window.API_BASE_URL_OVERRIDE = 'https://pattaku.onrender.com';
}

// AuthContext에서 토큰 만료 함수를 가져오기 위한 전역 변수
let showTokenExpiredFunction = null;

// AuthContext에서 호출할 함수 등록
export const setTokenExpiredHandler = (handler) => {
  showTokenExpiredFunction = handler;
};

// Axios 인스턴스 생성 - 무조건 Render URL 사용
const apiClient = axios.create({
  baseURL: window.API_BASE_URL_OVERRIDE || API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가 및 URL 강제 확인
apiClient.interceptors.request.use(
  (config) => {
    // S3 URL 사용 시 강제 차단
    if (config.baseURL && config.baseURL.includes('s3-website')) {
      console.error('🚨 BLOCKED S3 REQUEST! Redirecting to Render...');
      config.baseURL = 'https://pattaku.onrender.com';
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 모든 요청에 대해 URL 확인 로그
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('🌐 API Request:', {
      method: config.method?.toUpperCase(),
      url: fullUrl,
      baseURL: config.baseURL,
      isRenderUrl: config.baseURL.includes('onrender.com')
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase()
    });
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || 'unknown';
    const requestMethod = error.config?.method?.toUpperCase() || 'unknown';
    const fullUrl = error.config ? `${error.config.baseURL}${requestUrl}` : 'unknown';
    
    console.error('❌ API Response Error:', {
      method: requestMethod,
      url: requestUrl,
      fullUrl: fullUrl,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });
    
    // S3 URL로 요청이 갔는지 확인
    if (fullUrl.includes('s3-website')) {
      console.error('🚨🚨🚨 CRITICAL: Request went to S3! This should never happen!');
      console.error('🔧 Please refresh the page and check the build');
    }
    
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('userInfo');
      
      // AuthContext의 showTokenExpired 함수 호출
      if (showTokenExpiredFunction) {
        showTokenExpiredFunction();
      } else {
        // 폴백: 함수가 등록되지 않은 경우 바로 리다이렉트
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    
    // 에러 메시지 개선
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        '알 수 없는 오류가 발생했습니다.';
    
    return Promise.reject(new Error(errorMessage));
  }
);

// 전역 변수로 API 클라이언트 노출 (디버깅용)
window.DEBUG_API_CLIENT = apiClient;
window.DEBUG_API_URL = API_BASE_URL;

export default apiClient;
