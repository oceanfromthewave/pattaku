import apiClient from './apiClient';

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
