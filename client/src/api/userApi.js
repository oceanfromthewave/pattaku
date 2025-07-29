import apiClient from './apiClient';

// 마이페이지 API

// 내 프로필 조회
export const getMyProfile = async () => {
  const response = await apiClient.get('/api/users/profile');
  return response.data;
};

// 프로필 수정
export const updateProfile = async (profileData) => {
  const response = await apiClient.put('/api/users/profile', profileData);
  return response.data;
};

// 비밀번호 변경
export const changePassword = async (passwordData) => {
  const response = await apiClient.put('/api/users/password', passwordData);
  return response.data;
};

// 내가 쓴 글 목록
export const getMyPosts = async (params = {}) => {
  const response = await apiClient.get('/api/users/posts', { params });
  return response.data;
};

// 내가 쓴 댓글 목록
export const getMyComments = async (params = {}) => {
  const response = await apiClient.get('/api/users/comments', { params });
  return response.data;
};

// 활동 통계
export const getMyStats = async () => {
  const response = await apiClient.get('/api/users/stats');
  return response.data;
};

// 에러 메시지 추출
export const getApiErrorMessage = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다.';
};

// 회원가입
export const register = async (userData) => {
  const response = await apiClient.post('/api/users', userData);
  return response.data;
};

// 사용자 목록 조회
export const getUsers = async () => {
  const response = await apiClient.get('/api/users');
  return response.data;
};

// 사용자 정보 조회
export const getUserById = async (id) => {
  const response = await apiClient.get(`/api/users/${id}`);
  return response.data;
};
