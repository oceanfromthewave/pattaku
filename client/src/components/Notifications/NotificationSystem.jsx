
import { Bell, BellRing, X, CheckCheck, MessageCircle, Heart, UserPlus, Calendar, FileText } from 'lucide-react';
import useNotificationSocket from './useNotificationSocket';
import { markAsRead as apiMarkAsRead } from '../../api/notificationApi';
import styles from '../../styles/NotificationSystem.module.scss';
import headerStyles from '../../styles/Header.module.scss';
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

  // 알림 타입에 따른 아이콘 반환
  const getNotificationIcon = (type) => {
    const iconProps = { width: '20px', height: '20px' };
    
    switch (type) {
      case 'comment':
        return <MessageCircle {...iconProps} style={{ color: '#10b981' }} />;
      case 'like':
        return <Heart {...iconProps} style={{ color: '#ef4444' }} />;
      case 'follow':
        return <UserPlus {...iconProps} style={{ color: '#3b82f6' }} />;
      case 'schedule':
        return <Calendar {...iconProps} style={{ color: '#8b5cf6' }} />;
      case 'post':
        return <FileText {...iconProps} style={{ color: '#f59e0b' }} />;
      default:
        return <Bell {...iconProps} style={{ color: '#6b7280' }} />;
    }
  };

  // 알림 클릭 처리
  const handleNotificationClick = (notification) => {
    try {
      
      
      // postId가 있는 경우 (댄글, 좋아요, 게시글 알림)
      if (notification.postId) {
        
        navigate(`/posts/${notification.postId}`);
        return;
      }
      
      // post_id가 있는 경우 (스네이크 케이스)
      if (notification.post_id) {
        
        navigate(`/posts/${notification.post_id}`);
        return;
      }
      
      // scheduleId가 있는 경우
      if (notification.scheduleId || notification.schedule_id) {
        const scheduleId = notification.scheduleId || notification.schedule_id;
        
        navigate(`/schedules/${scheduleId}`);
        return;
      }
      
      // 사용자 관련 알림
      if (notification.senderId || notification.sender_id) {
        const userId = notification.senderId || notification.sender_id;
        
        navigate(`/users/${userId}`);
        return;
      }
      
      // 기본적으로 홈으로 이동
      
      navigate('/');
      
    } catch (error) {
      console.error('알림 네비게이션 오류:', error);
      // 오류 발생시 홈으로 이동
      navigate('/');
    }
  };

  return (
    <div className={styles['notification-icon-wrapper']}>
      <button 
        className={`${headerStyles.notificationBtn} ${styles['notification-icon']}`} 
        aria-label="알림" 
        onClick={() => setOpen(v => !v)} 
        style={{ position: 'relative' }}
      >
        {/* 벨 아이콘 */}
        <span style={{ fontSize: '20px' }}>🔔</span>
        
        {/* 알림 배지 */}
        {unreadCount > 0 && (
          <span className={`${headerStyles.notificationBadge} ${styles['notification-badge']}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className={styles['notification-dropdown']} style={{ marginTop: 8 }}>
          <div className={styles['notification-header']}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BellRing style={{ width: '20px', height: '20px', color: '#4076fa' }} />
              <h3 style={{ fontWeight: 600, margin: 0 }}>알림</h3>
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
                className={styles['mark-all-read-btn']}
                title="모든 알림 읽음 처리"
              >
                <CheckCheck style={{ width: '16px', height: '16px' }} />
                모두 읽음
              </button>
            )}
          </div>
          <div className={styles['notification-list']}>
            {notifications.length === 0 ? (
              <div className={styles['empty-state']}>
                <div className={styles.icon}>
                  <Bell style={{ width: '48px', height: '48px', opacity: 0.3 }} />
                </div>
                <h4>새로운 알림이 없습니다</h4>
                <p>활동이 있으면 여기에 표시됩니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={
                    styles['notification-item'] +
                    (!notification.read ? ' unread' : '')
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', width: '100%' }}>
                    {/* 알림 아이콘 */}
                    <div className={styles['notification-icon']}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* 알림 컨텐츠 */}
                    <div 
                      className={styles['notification-content']} 
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={async () => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                          try { 
                            await apiMarkAsRead(notification.id); 
                          } catch { 
                            /* ignore */ 
                          }
                        }
                        setOpen(false);
                        handleNotificationClick(notification);
                      }}
                    >
                      <p className={styles['notification-title']}>{notification.title}</p>
                      <p className={styles['notification-message']}>{notification.message}</p>
                      <p className={styles['notification-time']}>
                        <span>{formatTime(notification.createdAt || notification.created_at)}</span>
                        {!notification.read && (
                          <span className={styles['unread-dot']}></span>
                        )}
                      </p>
                    </div>
                    
                    {/* 삭제 버튼 */}
                    <div className={styles['notification-actions']}>
                      <button
                        onClick={e => { 
                          e.stopPropagation(); 
                          deleteNotification(notification.id); 
                        }}
                        title="삭제"
                      >
                        <X style={{ width: '16px', height: '16px' }} />
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
