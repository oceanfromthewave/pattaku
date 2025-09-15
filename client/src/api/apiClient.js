import axios from "axios";

// 🚨 EMERGENCY FIX - 절대 S3 URL 사용 금지
function getApiUrl() {
  const currentHost = window.location.hostname;
  if (currentHost === "localhost" || currentHost === "127.0.0.1") {
    return "http://localhost:5000";
  }
  // 프로덕션 환경 - 무조건 Render 사용
  return "https://pattaku.onrender.com";
}

const API_BASE_URL = getApiUrl();

console.log("🔥 EMERGENCY API CLIENT LOADED");
console.log("🌍 Current hostname:", window.location.hostname);
console.log("🎯 API Base URL:", API_BASE_URL);
console.log("🚫 S3 usage BLOCKED");

if (API_BASE_URL.includes("s3-website")) {
  console.error("🚨 CRITICAL ERROR: S3 URL detected! Forcing Render URL...");
  window.API_BASE_URL_OVERRIDE = "https://pattaku.onrender.com";
}

// AuthContext에서 토큰 만료 함수를 가져오기 위한 전역 변수
let showTokenExpiredFunction = null;

export const setTokenExpiredHandler = (handler) => {
  showTokenExpiredFunction = handler;
};

// ✅ headers: { 'Content-Type': ... } 아예 지정하지 않음!
const apiClient = axios.create({
  baseURL: window.API_BASE_URL_OVERRIDE || API_BASE_URL,
  timeout: 30000,
  // ❌ Content-Type 지정하지 마! (자동 처리)
});

// 요청 인터셉터 - 토큰 자동 추가 및 업로드 분기 처리
apiClient.interceptors.request.use(
  (config) => {
    // FormData면 Content-Type을 지우고, 아니면 JSON으로 세팅
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }
    // 토큰
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 개발 환경에서만 로그 출력
    if (import.meta.env.DEV) {
      const fullUrl = `${config.baseURL}${config.url}`;
      console.log("🌐 API Request:", {
        method: config.method?.toUpperCase(),
        url: fullUrl,
        baseURL: config.baseURL,
        isRenderUrl: config.baseURL.includes("onrender.com"),
      });
    }

    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error("❌ API Request Error:", error);
    }
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    // 개발 환경에서만 로그 출력
    if (import.meta.env.DEV) {
      console.log("✅ API Response Success:", {
        status: response.status,
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
      });
    }
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "unknown";
    const requestMethod = error.config?.method?.toUpperCase() || "unknown";
    const fullUrl = error.config
      ? `${error.config.baseURL}${requestUrl}`
      : "unknown";

    // 개발 환경에서만 상세 로그 출력
    if (import.meta.env.DEV) {
      console.error("❌ API Response Error:", {
        method: requestMethod,
        url: requestUrl,
        fullUrl: fullUrl,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
      });

      if (fullUrl.includes("s3-website")) {
        console.error(
          "🚨🚨🚨 CRITICAL: Request went to S3! This should never happen!"
        );
        console.error("🔧 Please refresh the page and check the build");
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("userInfo");
      if (showTokenExpiredFunction) {
        showTokenExpiredFunction();
      } else {
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          window.location.href = "/login";
        }
      }
    }

    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "알 수 없는 오류가 발생했습니다.";

    return Promise.reject(new Error(errorMessage));
  }
);

// 개발 환경에서만 전역 변수 노출
if (import.meta.env.DEV) {
  window.DEBUG_API_CLIENT = apiClient;
  window.DEBUG_API_URL = API_BASE_URL;
}

export default apiClient;
