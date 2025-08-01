import axios from 'axios';

// 강제 하드코딩된 API URL
const FORCE_API_URL = 'https://pattaku.onrender.com';

// AuthContext에서 토큰 만료 함수를 가져오기 위한 전역 변수
let showTokenExpiredFunction = null;

// AuthContext에서 호출할 함수 등록
export const setTokenExpiredHandler = (handler) => {
  showTokenExpiredFunction = handler;
};

console.log('🔗 API 클라이언트 설정:', FORCE_API_URL);

// Axios 인스턴스 생성 - 강제 URL 사용
const apiClient = axios.create({
  baseURL: FORCE_API_URL,
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
      fullUrl: `${FORCE_API_URL}${requestUrl}`
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
