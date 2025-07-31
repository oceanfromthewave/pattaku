import apiClient from "./apiClient";

// ===== 기본 인증 함수들 =====

// 로그인
export const login = async (userData) => {
  const response = await apiClient.post("/api/auth/login", userData);
  return response.data;
};

// 회원가입
export const register = async (userData) => {
  const response = await apiClient.post("/api/users", userData);
  return response.data;
};

// 토큰 검증
export const verifyToken = async () => {
  const response = await apiClient.get("/api/auth/verify");
  return response.data;
};

// 로그아웃
export const logout = async () => {
  const response = await apiClient.post("/api/auth/logout");
  return response.data;
};

// 비밀번호 변경
export const changePassword = async (passwordData) => {
  const response = await apiClient.put("/api/auth/password", passwordData);
  return response.data;
};

// 프로필 업데이트
export const updateProfile = async (profileData) => {
  const response = await apiClient.put("/api/auth/profile", profileData);
  return response.data;
};

// ===== 별칭 함수들 (하위 호환성을 위해) =====
export const loginUser = login;
export const registerUser = register;
export const verifyUser = verifyToken;
export const logoutUser = logout;

// ===== 기본 export =====
const authApi = {
  // 기본 함수들
  login,
  register,
  verifyToken,
  logout,
  changePassword,
  updateProfile,

  // 별칭 함수들
  loginUser,
  registerUser,
  verifyUser,
  logoutUser,
};

export default authApi;
