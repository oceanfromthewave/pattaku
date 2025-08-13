import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { WS_URL } from '../api/config';

const ChatContext = createContext();

export const useChatSocket = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatSocket must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { isLoggedIn, userInfo } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState({}); // roomId -> messages[]
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // roomId -> [userIds]
  const [currentRoom, setCurrentRoom] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const reconnectTimeoutRef = useRef(null);
  const connectionAttempts = useRef(0);

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('📢 알림 권한:', permission);
        return permission === 'granted';
      } catch (error) {
        console.error('❌ 알림 권한 요청 실패:', error);
        return false;
      }
    }
    return Notification.permission === 'granted';
  }, []);

  // 소켓 연결 및 인증
  useEffect(() => {
    if (isLoggedIn && userInfo && !socketRef.current) {
      console.log('🔌 채팅 소켓 연결 시작...', WS_URL);
      
      const newSocket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        maxReconnectionAttempts: 10,
        forceNew: true,
        upgrade: true,
        secure: true, // HTTPS에서 안전한 연결
        rejectUnauthorized: false
      });

      newSocket.on('connect', () => {
        console.log('✅ 채팅 소켓 연결 성공');
        setIsConnected(true);
        connectionAttempts.current = 0;
        
        // 브라우저 알림 권한 요청
        requestNotificationPermission();
        
        // 인증 토큰 전송
        const token = localStorage.getItem('token');
        if (token) {
          console.log('🔐 채팅 소켓 인증 시작...');
          newSocket.emit('chat:authenticate', token);
        } else {
          console.error('❌ 인증 토큰이 없습니다');
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ 채팅 소켓 연결 해제:', reason);
        setIsConnected(false);
        setIsAuthenticated(false);
        
        // 재연결 시도
        if (reason === 'io server disconnect') {
          setTimeout(() => {
            if (connectionAttempts.current < 5) {
              connectionAttempts.current++;
              console.log(`🔄 재연결 시도 ${connectionAttempts.current}/5`);
              newSocket.connect();
            }
          }, 3000);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ 채팅 소켓 연결 오류:', error);
        setIsConnected(false);
        setIsAuthenticated(false);
        connectionAttempts.current++;
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 채팅 소켓 재연결 성공:', attemptNumber);
        connectionAttempts.current = 0;
      });

      // 인증 결과
      newSocket.on('chat:authenticated', (data) => {
        if (data.success) {
          console.log('✅ 채팅 소켓 인증 성공');
          setIsAuthenticated(true);
        } else {
          console.error('❌ 채팅 소켓 인증 실패:', data.error);
          setIsAuthenticated(false);
        }
      });

      // 새 메시지 수신
      newSocket.on('chat:new_message', (message) => {
        console.log('💬 새 메시지 수신:', message);
        setMessages(prev => ({
          ...prev,
          [message.room_id]: [...(prev[message.room_id] || []), message]
        }));

        // 현재 방이 아닌 경우 안읽은 메시지 수 증가
        if (currentRoom !== message.room_id) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.room_id]: (prev[message.room_id] || 0) + 1
          }));
        }
      });

      // 메시지 수정
      newSocket.on('chat:message_edited', (data) => {
        const { messageId, newMessage, updatedAt } = data;
        console.log('✏️ 메시지 수정 알림:', messageId);
        setMessages(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(roomId => {
            updated[roomId] = updated[roomId].map(msg =>
              msg.id === messageId
                ? { ...msg, message: newMessage, updated_at: updatedAt }
                : msg
            );
          });
          return updated;
        });
      });

      // 메시지 삭제
      newSocket.on('chat:message_deleted', (data) => {
        const { messageId } = data;
        console.log('🗑️ 메시지 삭제 알림:', messageId);
        setMessages(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(roomId => {
            updated[roomId] = updated[roomId].filter(msg => msg.id !== messageId);
          });
          return updated;
        });
      });

      // 사용자 온라인/오프라인
      newSocket.on('chat:user_online', (data) => {
        console.log('👤 사용자 온라인:', data.nickname);
        setOnlineUsers(prev => {
          if (!prev.find(user => user.userId === data.userId)) {
            return [...prev, data];
          }
          return prev;
        });
      });

      newSocket.on('chat:user_offline', (data) => {
        console.log('👤 사용자 오프라인:', data.nickname);
        setOnlineUsers(prev => prev.filter(user => user.userId !== data.userId));
      });

      // 타이핑 상태
      newSocket.on('chat:user_typing', (data) => {
        const { userId, nickname, isTyping } = data;
        setTypingUsers(prev => {
          const updated = { ...prev };
          const roomTyping = updated[currentRoom] || [];
          
          if (isTyping) {
            if (!roomTyping.find(user => user.userId === userId)) {
              updated[currentRoom] = [...roomTyping, { userId, nickname }];
            }
          } else {
            updated[currentRoom] = roomTyping.filter(user => user.userId !== userId);
          }
          return updated;
        });
      });

      // 채팅방 참여/나가기 알림
      newSocket.on('chat:user_joined', (data) => {
        console.log('📥 사용자 채팅방 참여:', data);
      });

      newSocket.on('chat:user_left', (data) => {
        console.log('📤 사용자 채팅방 나가기:', data);
      });

      // 1:1 채팅 초대
      newSocket.on('chat:direct_invite', (data) => {
        console.log('💬 1:1 채팅 초대:', data);
        
        // 알림 표시
        const message = `${data.inviterNickname || data.inviterUsername}님이 1:1 채팅을 요청했습니다.`;
        
        // 브라우저 알림 (권한이 있는 경우)
        if (Notification.permission === 'granted') {
          new Notification('채팅 초대', {
            body: message,
            icon: '/favicon.png'
          });
        }
        
        // 시스템 알림으로도 표시 (Toast)
        if (window.notify && window.notify.info) {
          window.notify.info(message);
        } else {
          alert(message); // 폴백
        }
      });

      // 에러 처리
      newSocket.on('chat:error', (data) => {
        console.error('❌ 채팅 오류:', data.message);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    return () => {
      if (socketRef.current) {
        console.log('🔌 채팅 소켓 연결 해제');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isLoggedIn, userInfo]);

  // 채팅방 참여
  const joinRoom = (roomId) => {
    if (socket && isConnected && isAuthenticated) {
      console.log('🚪 채팅방 참여 시도:', roomId);
      socket.emit('chat:join_room', { roomId });
      setCurrentRoom(roomId);
      setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
    } else {
      console.warn('⚠️ 소켓이 연결되지 않았거나 인증되지 않음');
    }
  };

  // 채팅방 나가기
  const leaveRoom = (roomId) => {
    if (socket && isConnected && isAuthenticated) {
      console.log('🚪 채팅방 나가기 시도:', roomId);
      socket.emit('chat:leave_room', { roomId });
      if (currentRoom === roomId) {
        setCurrentRoom(null);
      }
    }
  };

  // 메시지 전송
  const sendMessage = (roomId, message, messageType = 'text', replyTo = null) => {
    if (socket && isConnected && isAuthenticated) {
      console.log('💬 메시지 전송 시도:', { roomId, message: message.substring(0, 20) + '...' });
      socket.emit('chat:send_message', {
        roomId,
        message,
        messageType,
        replyTo
      });
    } else {
      console.warn('⚠️ 메시지 전송 실패: 소켓 연결 또는 인증 상태 확인 필요');
    }
  };

  // 메시지 수정
  const editMessage = (messageId, newMessage) => {
    if (socket && isConnected && isAuthenticated) {
      console.log('✏️ 메시지 수정 시도:', messageId);
      socket.emit('chat:edit_message', { messageId, newMessage });
    }
  };

  // 메시지 삭제
  const deleteMessage = (messageId) => {
    if (socket && isConnected && isAuthenticated) {
      console.log('🗑️ 메시지 삭제 시도:', messageId);
      socket.emit('chat:delete_message', { messageId });
    }
  };

  // 타이핑 상태 전송
  const sendTyping = (roomId, isTyping) => {
    if (socket && isConnected && isAuthenticated) {
      socket.emit('chat:typing', { roomId, isTyping });
      
      // 타이핑 중지 타이머 설정
      if (isTyping) {
        if (typingTimeoutRef.current[roomId]) {
          clearTimeout(typingTimeoutRef.current[roomId]);
        }
        typingTimeoutRef.current[roomId] = setTimeout(() => {
          socket.emit('chat:typing', { roomId, isTyping: false });
        }, 3000);
      }
    }
  };

  // 읽음 상태 업데이트 (오류 허용)
  const markAsRead = (roomId) => {
    if (socket && isConnected && isAuthenticated) {
      try {
        socket.emit('chat:mark_read', { roomId });
        setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
      } catch (error) {
        console.warn('⚠️ 읽음 상태 업데이트 실패 (무시):', error);
      }
    }
  };

  // 1:1 채팅 초대
  const inviteDirectChat = (targetUserId) => {
    if (socket && isConnected && isAuthenticated) {
      socket.emit('chat:invite_direct', { targetUserId });
    }
  };

  // 특정 채팅방 메시지 가져오기
  const getRoomMessages = (roomId) => {
    return messages[roomId] || [];
  };

  // 특정 채팅방 안읽은 메시지 수
  const getRoomUnreadCount = (roomId) => {
    return unreadCounts[roomId] || 0;
  };

  // 전체 안읽은 메시지 수
  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
  };

  // 특정 채팅방 타이핑 중인 사용자들
  const getRoomTypingUsers = (roomId) => {
    return typingUsers[roomId] || [];
  };

  const value = {
    // 상태
    socket,
    isConnected,
    isAuthenticated,
    messages,
    onlineUsers,
    typingUsers,
    currentRoom,
    unreadCounts,

    // 액션
    joinRoom,
    leaveRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTyping,
    markAsRead,
    inviteDirectChat,

    // 헬퍼 함수
    getRoomMessages,
    getRoomUnreadCount,
    getTotalUnreadCount,
    getRoomTypingUsers,
    requestNotificationPermission,

    // 메시지 상태 업데이트 (컴포넌트에서 직접 사용)
    setMessages,
    setCurrentRoom
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;