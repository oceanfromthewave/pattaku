import apiClient from './apiClient';

// 게시글 목록 조회 (검색, 정렬 포함)
export const getPosts = async (params = {}) => {
  const response = await apiClient.get('/api/posts', { params });
  return response.data;
};

// 특정 게시글 조회
export const getPostById = async (id) => {
  const response = await apiClient.get(`/api/posts/${id}`);
  return response.data;
};

// 게시글 생성
export const createPost = async (formData) => {
  const response = await apiClient.post('/api/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 게시글 수정
export const updatePost = async (id, formData) => {
  const response = await apiClient.put(`/api/posts/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 게시글 삭제
export const deletePost = async (id) => {
  const response = await apiClient.delete(`/api/posts/${id}`);
  return response.data;
};

// 게시글 좋아요
export const likePost = async (id) => {
  const response = await apiClient.post(`/api/posts/${id}/like`);
  return response.data;
};

// 게시글 싫어요
export const dislikePost = async (id) => {
  const response = await apiClient.post(`/api/posts/${id}/dislike`);
  return response.data;
};
