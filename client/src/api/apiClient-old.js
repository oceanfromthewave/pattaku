import axios from 'axios';

// 🔥 프로덕션 환경에서 강제로 Render URL 사용
let API_BASE_URL = 'https://pattaku.onrender.com';

// 현재 호스트가 S3인 경우 강제로 Render로 변경
if (window.location.hostname.includes('s3-website')) {
  API_BASE_URL = 'https://pattaku.onrender.com';
  console.log('🚨 S3 환경 감지 - Render API URL로 강제 변경');
}

// 개발 환경 체크
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  console.log('🛠️ 개발 환경 감지');
}

console.log('🌐 최종 API URL:', API_BASE_URL);

// AuthContext에서 토큰 만료 함수를 가져오기 위한 전역 변수
let showTokenExpiredFunction = null;

// AuthContext에서 호출할 함수 등록
export const setTokenExpiredHandler = (handler) => {
  showTokenExpiredFunction = handler;
};

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 모든 요청에 대해 URL 확인 로그
    console.log('🌐 API 요청 URL:', `${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API 응답 성공:', response.status, response.config.url);
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || 'unknown';
    const requestMethod = error.config?.method?.toUpperCase() || 'unknown';
    
    console.error('❌ API 응답 오류:', {
      method: requestMethod,
      url: requestUrl,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      fullUrl: `${API_BASE_URL}${requestUrl}`
    });
    
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

export default apiClient;
