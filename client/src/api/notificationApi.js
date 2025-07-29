import apiClient from './apiClient';

const notificationApi = {
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/api/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      throw error;
    }
  },

  getNotifications: async (page = 1, limit = 20) => {
    try {
      const response = await apiClient.get(`/api/notifications?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
      return response.data.success;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/api/notifications/read-all');
      return response.data.success;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await apiClient.delete(`/api/notifications/${notificationId}`);
      return response.data.success;
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  },
};

export default notificationApi;
