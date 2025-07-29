import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, X, CheckCheck, MessageCircle, Heart, Reply, AtSign, Wifi, WifiOff } from 'lucide-react';
import styles from '../../styles/NotificationSystem.module.scss';
import '../../styles/Header.scss';

// 실제 WebSocket 연동 Hook
const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // 실제 WebSocket 연결 (서버 주소/포트에 맞게 수정)
    const ws = new window.WebSocket(`ws://localhost:5000?userId=${userId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('알림 서버에 연결되었습니다.');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('알림 서버 연결이 끊어졌습니다.');
    };

    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/notification-icon.png',
            tag: notification.id
          });
        }
      } catch (error) {
        console.error('알림 파싱 오류:', error);
      }
    };

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      ws.close();
    };
  }, [userId]);

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};

const NotificationIcon = ({ type }) => {
  const iconProps = { className: "w-4 h-4" };
  switch (type) {
    case 'comment': return <MessageCircle {...iconProps} className="w-4 h-4 text-blue-500" />;
    case 'like': return <Heart {...iconProps} className="w-4 h-4 text-red-500" />;
    case 'reply': return <Reply {...iconProps} className="w-4 h-4 text-green-500" />;
    case 'mention': return <AtSign {...iconProps} className="w-4 h-4 text-purple-500" />;
    default: return <Bell {...iconProps} className="w-4 h-4 text-gray-500" />;
  }
};

const NotificationDropdown = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications(userId);

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <div className="notification-icon-wrapper">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-icon"
        aria-label="알림"
        style={{ position: 'relative' }}
      >
        {unreadCount > 0 ? (
          <BellRing style={{ width: 24, height: 24, color: '#4076fa' }} />
        ) : (
          <Bell style={{ width: 24, height: 24 }} />
        )}
        {/* 연결 상태 표시 */}
        <span style={{ position: 'absolute', bottom: 2, right: 2 }}>
          {isConnected ? (
            <Wifi style={{ width: 14, height: 14, color: '#22c55e' }} />
          ) : (
            <WifiOff style={{ width: 14, height: 14, color: '#ef4444' }} />
          )}
        </span>
        {/* 읽지 않은 알림 카운트 */}
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={styles['notification-dropdown']} style={{marginTop: 8}}>
            <div className={styles['notification-header']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 style={{ fontWeight: 600 }}>알림</h3>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  background: isConnected ? '#bbf7d0' : '#fecaca',
                  color: isConnected ? '#166534' : '#991b1b'
                }}>
                  {isConnected ? '실시간' : '연결끊김'}
                </span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{ fontSize: '0.9rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <CheckCheck className="w-4 h-4" />
                  모두 읽음
                </button>
              )}
            </div>
            <div className={styles['notification-list']}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>새로운 알림이 없습니다</p>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.5rem' }}>활동이 있으면 여기에 표시됩니다</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={
                      styles['notification-item'] +
                      (!notification.read ? ' unread' : '')
                    }
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      setIsOpen(false);
                      // TODO: 라우팅 처리 필요
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                      <img
                        src={notification.sourceUser?.avatar || '/api/placeholder/32/32'}
                        alt={notification.sourceUser?.name || 'User'}
                        className={styles['notification-avatar']}
                      />
                      <div className={styles['notification-content']}>
                        <p className="notification-title">{notification.title}</p>
                        <p className="notification-message">{notification.message}</p>
                        <p className="notification-time">
                          <span>{formatTime(notification.createdAt)}</span>
                          {!notification.read && (
                            <span style={{ width: '0.375rem', height: '0.375rem', background: '#3b82f6', borderRadius: '9999px', display: 'inline-block', marginLeft: '0.25rem' }}></span>
                          )}
                        </p>
                      </div>
                      <div className={styles['notification-actions']}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}
                          title="삭제"
                        >
                          <X className="w-4 h-4 text-red-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div style={{ padding: '0.75rem', borderTop: '1px solid #23242a', background: '#f1f5f9' }}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: 전체 알림 페이지 라우팅 필요
                  }}
                  style={{ width: '100%', textAlign: 'center', fontSize: '0.95rem', color: '#2563eb', fontWeight: 500, padding: '0.5rem 0', background: 'none', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                >
                  모든 알림 보기 →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
