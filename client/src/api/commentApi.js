import apiClient from './apiClient';

// 게시글 댓글 조회
export const getComments = async (postId) => {
  const response = await apiClient.get(`/api/posts/${postId}/comments`);
  return response.data;
};

// 댓글 작성
export const createComment = async (postId, commentData) => {
  const response = await apiClient.post(`/api/posts/${postId}/comments`, commentData);
  return response.data;
};

// 댓글 수정
export const updateComment = async (commentId, commentData) => {
  const response = await apiClient.put(`/api/comments/${commentId}`, commentData);
  return response.data;
};

// 댓글 삭제
export const deleteComment = async (commentId) => {
  const response = await apiClient.delete(`/api/comments/${commentId}`);
  return response.data;
};

// 댓글 좋아요
export const likeComment = async (commentId) => {
  const response = await apiClient.post(`/api/comments/${commentId}/like`);
  return response.data;
};
