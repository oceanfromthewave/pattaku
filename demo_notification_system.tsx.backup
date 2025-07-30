import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Bell, BellRing, X, Check, CheckCheck, MessageCircle, Heart, Reply, AtSign, Wifi, WifiOff } from 'lucide-react';

// 실시간 알림 컨텍스트
const NotificationContext = createContext();

// WebSocket 연결 시뮬레이션 (실제로는 서버와 연결)
class MockWebSocket {
  constructor(userId) {
    this.userId = userId;
    this.connected = false;
    this.listeners = [];
    
    // 연결 시뮬레이션
    setTimeout(() => {
      this.connected = true;
      this.onopen?.();
    }, 1000);
    
    // 실시간 알림 시뮬레이션 (테스트용)
    this.startMockNotifications();
  }
  
  startMockNotifications() {
    const notifications = [
      {
        id: Date.now() + Math.random(),
        type: 'comment',
        title: '새 댓글',
        message: '김철수님이 회원님의 게시물에 댓글을 남겼습니다.',
        link: '/posts/123',
        createdAt: new Date().toISOString(),
        read: false,
        sourceUser: { name: '김철수', avatar: '/api/placeholder/32/32' }
      },
      {
        id: Date.now() + Math.random() + 1,
        type: 'like',
        title: '게시물 추천',
        message: '이영희님이 회원님의 게시물을 추천했습니다.',
        link: '/posts/124',
        createdAt: new Date(Date.now() - 300000).toISOString(),
        read: false,
        sourceUser: { name: '이영희', avatar: '/api/placeholder/32/32' }
      }
    ];
    
    // 5초마다 랜덤 알림 생성
    setInterval(() => {
      if (this.connected && Math.random() > 0.7) {
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        const newNotification = {
          ...randomNotification,
          id: Date.now() + Math.random(),
          createdAt: new Date().toISOString()
        };
        this.onmessage?.({ data: JSON.stringify(newNotification) });
      }
    }, 5000);
  }
  
  close() {
    this.connected = false;
    this.onclose?.();
  }
}

// 알림 관리 Hook
const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'comment',
      title: '새 댓글',
      message: '박민수님이 회원님의 "React 질문"에 댓글을 남겼습니다.',
      link: '/posts/1',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      sourceUser: { name: '박민수', avatar: '/api/placeholder/32/32' }
    },
    {
      id: 2,
      type: 'like',
      title: '게시물 추천',
      message: '최지영님이 회원님의 게시물을 추천했습니다.',
      link: '/posts/2',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      read: true,
      sourceUser: { name: '최지영', avatar: '/api/placeholder/32/32' }
    },
    {
      id: 3,
      type: 'reply',
      title: '답글 알림',
      message: '정다은님이 회원님의 댓글에 답글을 남겼습니다.',
      link: '/posts/3',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      read: false,
      sourceUser: { name: '정다은', avatar: '/api/placeholder/32/32' }
    }
  ]);
  
  const [unreadCount, setUnreadCount] = useState(2);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // WebSocket 연결 (실제 환경에서는 실제 WebSocket 사용)
    wsRef.current = new MockWebSocket(userId);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log('알림 서버에 연결되었습니다.');
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      console.log('알림 서버 연결이 끊어졌습니다.');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('새 알림 수신:', notification);
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
        
        // 브라우저 알림 표시
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

    // 브라우저 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
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

// 알림 아이콘 컴포넌트
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

// 알림 드롭다운 컴포넌트
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
    <div className="relative">
      {/* 알림 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6 text-blue-600 animate-pulse" />
        ) : (
          <Bell className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
        )}
        
        {/* 연결 상태 표시 */}
        <div className="absolute top-0 right-0 flex items-center">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
        </div>
        
        {/* 읽지 않은 알림 카운트 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <>
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 드롭다운 메뉴 */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {/* 헤더 */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">알림</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isConnected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? '실시간' : '연결끊김'}
                </span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  모두 읽음
                </button>
              )}
            </div>

            {/* 알림 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">새로운 알림이 없습니다</p>
                  <p className="text-sm text-gray-400 mt-1">활동이 있으면 여기에 표시됩니다</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-all duration-200 group ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      setIsOpen(false);
                      console.log('Navigate to:', notification.link);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* 아바타 */}
                      <div className="relative">
                        <img
                          src={notification.sourceUser?.avatar || '/api/placeholder/32/32'}
                          alt={notification.sourceUser?.name || 'User'}
                          className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                          <NotificationIcon type={notification.type} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <span>{formatTime(notification.createdAt)}</span>
                          {!notification.read && (
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1.5 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
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

            {/* 푸터 */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    console.log('Navigate to all notifications');
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded-md transition-colors"
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

// 헤더 컴포넌트
const Header = ({ user }) => {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                💬 커뮤니티
              </h1>
            </div>
            
            {/* 네비게이션 */}
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <a href="#" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                홈
              </a>
              <a href="#" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                게시판
              </a>
              <a href="#" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                인기글
              </a>
            </nav>
          </div>

          {/* 우측 메뉴 */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* 알림 */}
                <NotificationDropdown userId={user.id} />
                
                {/* 사용자 메뉴 */}
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || '/api/placeholder/32/32'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-blue-100"
                  />
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.name}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                  로그인
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  회원가입
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// 메인 앱 컴포넌트
const App = () => {
  const [user] = useState({
    id: 'user123',
    name: '홍길동',
    avatar: '/api/placeholder/32/32'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔔 실시간 알림 시스템 데모
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">기능 설명</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• 실시간 WebSocket 연결로 즉시 알림 수신</li>
                <li>• 읽음/읽지않음 상태 관리</li>
                <li>• 브라우저 알림 지원</li>
                <li>• 다양한 알림 타입 (댓글, 좋아요, 답글, 멘션)</li>
                <li>• 연결 상태 실시간 표시</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">테스트 방법</h3>
              <p className="text-green-800 text-sm">
                5초마다 랜덤하게 새로운 알림이 생성됩니다. 
                우측 상단의 알림 아이콘을 클릭해서 확인해보세요! 
                🔔 아이콘이 흔들리고 빨간 숫자가 표시됩니다.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">댓글 알림</span>
                </div>
                <p className="text-sm text-gray-600">새 댓글이 달렸을 때</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="font-medium">좋아요 알림</span>
                </div>
                <p className="text-sm text-gray-600">게시물을 추천했을 때</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Reply className="w-5 h-5 text-green-500" />
                  <span className="font-medium">답글 알림</span>
                </div>
                <p className="text-sm text-gray-600">댓글에 답글이 달렸을 때</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AtSign className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">멘션 알림</span>
                </div>
                <p className="text-sm text-gray-600">사용자를 언급했을 때</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;