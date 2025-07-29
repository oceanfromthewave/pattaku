import apiClient from './apiClient';

// 로그인
export const login = async (userData) => {
  const response = await apiClient.post('/api/auth/login', userData);
  return response.data;
};

// 토큰 검증
export const verifyToken = async () => {
  const response = await apiClient.get('/api/auth/verify');
  return response.data;
};
