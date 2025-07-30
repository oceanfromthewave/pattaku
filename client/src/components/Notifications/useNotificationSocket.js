import { useEffect, useRef, useState } from 'react';
import { getNotifications, markAllAsRead as apiMarkAllAsRead } from '../../api/notificationApi';

export default function useNotificationSocket(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      console.warn('WebSocket: userId가 없습니다. 연결하지 않음');
      return;
    }
    console.log('WebSocket: 연결 시도, userId =', userId);
    // 1. 서버에서 알림 목록 fetch
    getNotifications(1, 50).then(data => {
      // 서버 응답이 배열 또는 객체일 수 있으므로 안전하게 처리
      let notiArr = Array.isArray(data.notifications)
        ? data.notifications
        : (data.notifications?.notifications || []);
      // 서버에서 내려온 알림을 프론트에서 사용할 수 있게 변환
      const mapped = notiArr.map(n => ({
        ...n,
        read: n.read !== undefined ? n.read : n.is_read,
        createdAt: n.createdAt || n.created_at
      }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
    }).catch(() => {
      setNotifications([]);
      setUnreadCount(0);
    });

    // 2. WebSocket 연결
    const ws = new window.WebSocket(`ws://localhost:5000?userId=${userId}`);
    wsRef.current = ws;
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket: 연결 성공', userId);
    };
    ws.onerror = (e) => {
      console.error('WebSocket: 연결 에러', e);
    };
    ws.onclose = (e) => {
      setIsConnected(false);
      console.warn('WebSocket: 연결 종료', userId, e);
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
      } catch {}
    };
    if (Notification.permission === 'default') Notification.requestPermission();
    return () => ws.close();
  }, [userId]);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  const markAllAsRead = async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };
  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, deleteNotification };
}
