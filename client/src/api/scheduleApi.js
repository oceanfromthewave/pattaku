import apiClient from './apiClient';

// 스케줄 목록 조회
export const getSchedules = async (params = {}) => {
  const response = await apiClient.get('/api/schedules', { params });
  return response.data;
};

// 특정 스케줄 조회
export const getScheduleById = async (id) => {
  const response = await apiClient.get(`/api/schedules/${id}`);
  return response.data;
};

// 스케줄 생성
export const createSchedule = async (formData) => {
  const response = await apiClient.post('/api/schedules', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 스케줄 수정
export const updateSchedule = async (id, scheduleData) => {
  const response = await apiClient.put(`/api/schedules/${id}`, scheduleData);
  return response.data;
};

// 스케줄 삭제
export const deleteSchedule = async (id) => {
  const response = await apiClient.delete(`/api/schedules/${id}`);
  return response.data;
};

// 스케줄 투표
export const voteSchedule = async (scheduleId, voteData) => {
  const response = await apiClient.post(`/api/schedules/${scheduleId}/vote`, voteData);
  return response.data;
};

// ===== 댓글 관련 API =====

// 스케줄 댓글 조회 (로그인 상태 고려)
export const getScheduleComments = async (scheduleId) => {
  const response = await apiClient.get(`/api/schedules/${scheduleId}/comments`);
  return response.data;
};

// 스케줄 댓글 작성 (파일 업로드 지원)
export const createScheduleComment = async (scheduleId, commentData) => {
  // FormData로 변환하여 파일 업로드 지원
  const formData = new FormData();
  
  // 텍스트 데이터 추가
  formData.append('content', commentData.content);
  if (commentData.parentId) {
    formData.append('parentId', commentData.parentId);
  }
  
  // 파일이 있다면 추가
  if (commentData.file) {
    formData.append('file', commentData.file);
  }
  
  const response = await apiClient.post(`/api/schedules/${scheduleId}/comments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 스케줄 댓글 수정
export const updateScheduleComment = async (scheduleId, commentId, commentData) => {
  const response = await apiClient.put(`/api/schedules/${scheduleId}/comments/${commentId}`, commentData);
  return response.data;
};

// 스케줄 댓글 삭제
export const deleteScheduleComment = async (scheduleId, commentId) => {
  const response = await apiClient.delete(`/api/schedules/${scheduleId}/comments/${commentId}`);
  return response.data;
};

// 스케줄 댓글 좋아요
export const likeScheduleComment = async (scheduleId, commentId) => {
  const response = await apiClient.post(`/api/schedules/${scheduleId}/comments/${commentId}/like`);
  return response.data;
};

// 스케줄 댓글 싫어요
export const dislikeScheduleComment = async (scheduleId, commentId) => {
  const response = await apiClient.post(`/api/schedules/${scheduleId}/comments/${commentId}/dislike`);
  return response.data;
};

// 사용자 댓글 목록 조회
export const getUserScheduleComments = async (params = {}) => {
  const response = await apiClient.get('/api/user/schedule-comments', { params });
  return response.data;
};

// ===== 에러 핸들링 헬퍼 =====

// API 에러 메시지 추출
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

// 네트워크 오류 확인
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

// 권한 오류 확인
export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};