import React, { useState, useEffect } from 'react';
import notificationApi from '../../api/notificationApi';
import Loading from '../Loading';
import Modal from '../Modal';
import Pagination from '../Pagination';
import socket from '../../utils/socket';

const NotificationList = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // 페이지당 알림 수

  const fetchNotifications = async (page) => {
    setLoading(true);
    try {
      const data = await notificationApi.getNotifications(page, limit);
      setNotifications(data.notifications);
      setTotalPages(Math.ceil(data.totalCount / limit));
      setCurrentPage(page);
    } catch (error) {
      console.error('알림 목록 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);

      // 실시간 알림 업데이트 처리
      socket.on('notification', (newNotification) => {
        // 새 알림이 오면 목록을 새로고침하거나 추가
        // 여기서는 간단히 새로고침 (더 복잡한 로직은 중복 방지 등 필요)
        fetchNotifications(currentPage); 
      });

      socket.on('notification_read', (data) => {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === data.notificationId ? { ...notif, is_read: 1 } : notif
          )
        );
      });

      socket.on('all_notifications_read', () => {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: 1 })));
      });

      socket.on('notification_deleted', (data) => {
        setNotifications(prev => prev.filter(notif => notif.id !== data.notificationId));
      });

      return () => {
        socket.off('notification');
        socket.off('notification_read');
        socket.off('all_notifications_read');
        socket.off('notification_deleted');
      };
    }
  }, [isOpen, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      // UI 업데이트는 socket.on('notification_read')에서 처리
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      // UI 업데이트는 socket.on('all_notifications_read')에서 처리
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      // UI 업데이트는 socket.on('notification_deleted')에서 처리
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="알림">
      <div className="notification-list-container">
        {loading ? (
          <Loading />
        ) : notifications.length === 0 ? (
          <p>새로운 알림이 없습니다.</p>
        ) : (
          <>
            <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">모두 읽음으로 표시</button>
            <ul className="notification-items">
              {notifications.map((notif) => (
                <li key={notif.id} className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}>
                  <div className="notification-content">
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">{new Date(notif.created_at).toLocaleString()}</span>
                  </div>
                  <div className="notification-actions">
                    {!notif.is_read && (
                      <button onClick={() => handleMarkAsRead(notif.id)} className="read-btn">읽음</button>
                    )}
                    <button onClick={() => handleDeleteNotification(notif.id)} className="delete-btn">삭제</button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </Modal>
  );
};

export default NotificationList;
