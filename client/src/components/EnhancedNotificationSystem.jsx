import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useImprovedNotificationSocket from './Notifications/useImprovedNotificationSocket';
import styles from '../../styles/EnhancedNotificationSystem.module.scss';

function EnhancedNotificationSystem({ userId }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useImprovedNotificationSocket(userId);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.postId) {
      navigate(`/posts/${notification.postId}`);
    }
  };

  return (
    <div className={styles.notificationSystem}>
      <button className={styles.notificationButton} onClick={handleToggle}>
        🔔
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className={styles.notificationList}>
          <div className={styles.header}>
            <h3>알림</h3>
            {unreadCount > 0 && (
              <button className={styles.markAsRead} onClick={markAllAsRead}>
                모두 읽음
              </button>
            )}
          </div>
          <div className={styles.content}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>새로운 알림이 없습니다.</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p>{notification.message}</p>
                  <div className={styles.timestamp}>
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedNotificationSystem;

