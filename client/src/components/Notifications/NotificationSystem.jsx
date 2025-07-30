
import { Bell, BellRing, X, CheckCheck } from 'lucide-react';
import useNotificationSocket from './useNotificationSocket';
import { markAsRead as apiMarkAsRead } from '../../api/notificationApi';
import styles from '../../styles/NotificationSystem.module.scss';
import '../../styles/Header.scss';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationSystem({ userId }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationSocket(userId);

  return (
    <div className="notification-icon-wrapper">
      <button className="notification-icon" aria-label="알림" onClick={() => setOpen(v => !v)} style={{ position: 'relative' }}>
        {unreadCount > 0 ? (
          <BellRing style={{ width: 24, height: 24, color: '#4076fa' }} />
        ) : (
          <Bell style={{ width: 24, height: 24 }} />
        )}
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      {open && (
        <div className={styles['notification-dropdown']} style={{ marginTop: 8 }}>
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
              <button onClick={markAllAsRead} style={{ fontSize: '0.9rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
                    if (!notification.read) markAsRead(notification.id);
                    setOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', width: '100%' }}>
                    <div className={styles['notification-content']} style={{ flex: 1, cursor: 'pointer' }}
                      onClick={async () => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                          try { await apiMarkAsRead(notification.id); } catch {}
                        }
                        setOpen(false);
                        if (notification.postId) {
                          navigate(`/posts/${notification.postId}`);
                        }
                      }}
                    >
                      <p className="notification-title">{notification.title}</p>
                      <p className="notification-message">{notification.message}</p>
                      <p className="notification-time">
                        <span>{formatTime(notification.createdAt || notification.created_at)}</span>
                        {!notification.read && (
                          <span style={{ width: '0.375rem', height: '0.375rem', background: '#3b82f6', borderRadius: '9999px', display: 'inline-block', marginLeft: '0.25rem' }}></span>
                        )}
                      </p>
                    </div>
                    <div className={styles['notification-actions']}>
                      <button
                        onClick={e => { e.stopPropagation(); deleteNotification(notification.id); }}
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
        </div>
      )}
    </div>
  );
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  let time;
  if (typeof timestamp === 'string') {
    // UTC(끝이 Z)만 KST로 변환, 이미 KST면 그대로
    if (timestamp.endsWith('Z')) {
      time = new Date(new Date(timestamp).getTime() + 9 * 60 * 60 * 1000);
    } else {
      time = new Date(timestamp);
    }
  } else {
    time = new Date(timestamp);
  }
  if (isNaN(time.getTime())) return '';
  const now = new Date();
  let diff = (now - time) / 1000; // 초 단위
  if (diff < 0) diff = 0;
  if (diff < 60) return `${Math.floor(diff)}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}
