import apiClient from './apiClient';

// ===== 알림 관련 API 함수들 =====

// 읽지 않은 알림 개수 조회
export const getUnreadCount = async () => {
  try {
    const response = await apiClient.get('/api/notifications/unread-count');
    return response.data.count;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    throw error;
  }
};

// 알림 목록 조회
export const getNotifications = async (page = 1, limit = 20) => {
  try {
    const response = await apiClient.get(`/api/notifications?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// 알림 읽음 처리
export const markAsRead = async (notificationId) => {
  try {
    const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
    return response.data.success;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

// 모든 알림 읽음 처리
export const markAllAsRead = async () => {
  try {
    const response = await apiClient.put('/api/notifications/read-all');
    return response.data.success;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// 알림 삭제
export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiClient.delete(`/api/notifications/${notificationId}`);
    return response.data.success;
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
    throw error;
  }
};

// 특정 알림 조회
export const getNotification = async (notificationId) => {
  try {
    const response = await apiClient.get(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching notification ${notificationId}:`, error);
    throw error;
  }
};

// 알림 설정 조회
export const getNotificationSettings = async () => {
  try {
    const response = await apiClient.get('/api/notifications/settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    throw error;
  }
};

// 알림 설정 업데이트
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await apiClient.put('/api/notifications/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

// ===== 기본 export (하위 호환성) =====
const notificationApi = {
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotification,
  getNotificationSettings,
  updateNotificationSettings,
};

export default notificationApi;
