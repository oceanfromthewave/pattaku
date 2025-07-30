import { useEffect, useRef, useState, useCallback } from 'react';
import { getNotifications, markAllAsRead as apiMarkAllAsRead, deleteNotification as apiDeleteNotification } from '../../api/notificationApi';
import { toast } from 'react-toastify';

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
const RECONNECT_INTERVAL = 3000; // 3초
const MAX_RECONNECT_ATTEMPTS = 5;

export default function useImprovedNotificationSocket(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const hasInitializedRef = useRef(false);

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('브라우저 알림 권한:', permission);
      } catch (error) {
        console.warn('브라우저 알림 권한 요청 실패:', error);
      }
    }
  }, []);

  // 브라우저 알림 표시
  const showBrowserNotification = useCallback((notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/notification-icon.png',
          tag: `notification-${notification.id}`,
          badge: '/badge-icon.png',
          vibrate: [200, 100, 200],
          renotify: false,
          requireInteraction: false,
        });

        // 클릭시 알림 닫기
        browserNotification.onclick = () => {
          browserNotification.close();
          window.focus();
        };

        // 자동 닫기 (5초 후)
        setTimeout(() => {
          browserNotification.close();
        }, 5000);

      } catch (error) {
        console.warn('브라우저 알림 표시 실패:', error);
      }
    }
  }, []);

  // 서버에서 초기 알림 데이터 로드
  const loadInitialNotifications = useCallback(async () => {
    if (!userId || hasInitializedRef.current) return;
    
    try {
      console.log('📥 초기 알림 데이터 로드 중...', userId);
      const data = await getNotifications(1, 50);
      
      let notiArr = Array.isArray(data.notifications) 
        ? data.notifications 
        : (data.notifications?.notifications || []);
      
      const mapped = notiArr.map(n => ({
        ...n,
        read: n.read !== undefined ? n.read : n.is_read,
        createdAt: n.createdAt || n.created_at
      }));
      
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
      hasInitializedRef.current = true;
      
      console.log(`✅ 초기 알림 로드 완료: ${mapped.length}개 (읽지않음: ${mapped.filter(n => !n.read).length}개)`);
    } catch (error) {
      console.error('초기 알림 로드 실패:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userId]);

  // WebSocket 재연결
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`❌ WebSocket 재연결 포기: 최대 시도 횟수(${MAX_RECONNECT_ATTEMPTS}) 초과`);
      setIsReconnecting(false);
      toast.error('실시간 알림 연결에 실패했습니다. 페이지를 새로고침해주세요.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
      return;
    }

    reconnectAttemptsRef.current++;
    setIsReconnecting(true);
    
    console.log(`🔄 WebSocket 재연결 시도 ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, RECONNECT_INTERVAL);
  }, []);

  // WebSocket 연결
  const connectWebSocket = useCallback(() => {
    if (!userId) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket이 이미 연결되어 있습니다.');
      return;
    }

    try {
      console.log(`🔌 WebSocket 연결 시도: ${WEBSOCKET_URL}?userId=${userId}`);
      const ws = new WebSocket(`${WEBSOCKET_URL}?userId=${userId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0;
        console.log('✅ WebSocket 연결 성공:', userId);
        
        // 토스트 알림
        toast.success('실시간 알림이 연결되었습니다', {
          position: 'bottom-right',
          autoClose: 2000,
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket 메시지 수신:', data);
          
          if (data.type) {
            // 시스템 메시지 처리
            switch (data.type) {
              case 'notification_read':
                setNotifications(prev => 
                  prev.map(n => n.id === data.notificationId ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
                break;
              case 'all_notifications_read':
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
                break;
              case 'notification_deleted':
                setNotifications(prev => prev.filter(n => n.id !== data.notificationId));
                break;
              case 'unread_count_update':
                setUnreadCount(data.unreadCount);
                break;
              default:
                console.log('알 수 없는 시스템 메시지:', data);
            }
          } else {
            // 새로운 알림 처리
            const notification = {
              ...data,
              read: false,
              createdAt: data.created_at || new Date().toISOString()
            };
            
            setNotifications(prev => [notification, ...prev.slice(0, 49)]);
            setUnreadCount(prev => prev + 1);
            
            // 브라우저 알림 표시
            showBrowserNotification(notification);
            
            // 토스트 알림
            toast.info(notification.title, {
              position: 'bottom-right',
              autoClose: 4000,
            });
            
            console.log('🔔 새 알림 수신:', notification.title);
          }
        } catch (error) {
          console.error('WebSocket 메시지 파싱 오류:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket 에러:', error);
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        console.warn(`🔌 WebSocket 연결 종료: ${userId}, 코드: ${event.code}, 이유: ${event.reason}`);
        
        // 정상적인 종료가 아닌 경우 재연결 시도
        if (event.code !== 1000 && event.code !== 1001) {
          attemptReconnect();
        }
      };

    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      setIsConnected(false);
      attemptReconnect();
    }
  }, [userId, attemptReconnect, showBrowserNotification]);

  // WebSocket 연결 해제
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsReconnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  // 알림 읽음 처리
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // WebSocket으로 읽음 확인 전송
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'notification_read',
        notificationId,
        timestamp: new Date()
      }));
    }
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      toast.success('모든 알림을 읽음으로 처리했습니다', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      toast.error('알림 처리 중 오류가 발생했습니다', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  }, []);

  // 알림 삭제
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await apiDeleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast.success('알림이 삭제되었습니다', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('알림 삭제 실패:', error);
      toast.error('알림 삭제 중 오류가 발생했습니다', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  }, []);

  // 페이지 가시성 변경 처리
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 페이지가 백그라운드로 이동');
      } else {
        console.log('📱 페이지가 포그라운드로 복귀');
        // 포그라운드 복귀시 연결 상태 확인
        if (userId && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
          console.log('🔄 페이지 복귀시 WebSocket 재연결');
          connectWebSocket();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, connectWebSocket]);

  // 메인 useEffect
  useEffect(() => {
    if (!userId) {
      console.warn('❌ userId가 없어 WebSocket 연결하지 않음');
      disconnectWebSocket();
      hasInitializedRef.current = false;
      return;
    }

    console.log('🚀 useNotificationSocket 초기화:', userId);

    // 브라우저 알림 권한 요청
    requestNotificationPermission();
    
    // 초기 데이터 로드
    loadInitialNotifications();
    
    // WebSocket 연결
    connectWebSocket();

    // 정리 함수
    return () => {
      console.log('🧹 useNotificationSocket 정리:', userId);
      disconnectWebSocket();
    };
  }, [userId, connectWebSocket, disconnectWebSocket, loadInitialNotifications, requestNotificationPermission]);

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 네트워크 온라인 상태');
      if (userId && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
        connectWebSocket();
      }
    };

    const handleOffline = () => {
      console.log('🌐 네트워크 오프라인 상태');
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId, connectWebSocket]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isReconnecting,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    reconnectAttemptsRef: reconnectAttemptsRef.current,
  };
}
