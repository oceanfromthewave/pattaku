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
  const [messages, setMessages] = useState({}); // roomId -> messages[]
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // roomId -> [userIds]
  const [currentRoom, setCurrentRoom] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef({});

  // 소켓 연결 및 인증
  useEffect(() => {
    if (isLoggedIn && userInfo && !socketRef.current) {
      console.log('🔌 채팅 소켓 연결 시작...');
      
      const newSocket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('✅ 채팅 소켓 연결 성공');
        setIsConnected(true);
        
        // 인증 토큰 전송
        const token = localStorage.getItem('token');
        if (token) {
          newSocket.emit('chat:authenticate', token);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('❌ 채팅 소켓 연결 해제');
        setIsConnected(false);
      });

      // 인증 결과
      newSocket.on('chat:authenticated', (data) => {
        if (data.success) {
          console.log('✅ 채팅 소켓 인증 성공');
        } else {
          console.error('❌ 채팅 소켓 인증 실패:', data.error);
        }
      });

      // 새 메시지 수신
      newSocket.on('chat:new_message', (message) => {
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
        setOnlineUsers(prev => [...prev, data]);
      });

      newSocket.on('chat:user_offline', (data) => {
        setOnlineUsers(prev => prev.filter(user => user.userId !== data.userId));
      });

      // 타이핑 상태
      newSocket.on('chat:user_typing', (data) => {
        const { userId, nickname, isTyping } = data;
        setTypingUsers(prev => {
          const updated = { ...prev };
          if (isTyping) {
            updated[currentRoom] = [...(updated[currentRoom] || []), { userId, nickname }];
          } else {
            updated[currentRoom] = (updated[currentRoom] || []).filter(user => user.userId !== userId);
          }
          return updated;
        });
      });

      // 1:1 채팅 초대
      newSocket.on('chat:direct_invite', (data) => {
        // 1:1 채팅 초대 알림 처리
        console.log('💬 1:1 채팅 초대:', data);
      });

      // 에러 처리
      newSocket.on('chat:error', (data) => {
        console.error('채팅 오류:', data.message);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isLoggedIn, userInfo]);

  // 채팅방 참여
  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('chat:join_room', { roomId });
      setCurrentRoom(roomId);
      setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
    }
  };

  // 채팅방 나가기
  const leaveRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('chat:leave_room', { roomId });
      if (currentRoom === roomId) {
        setCurrentRoom(null);
      }
    }
  };

  // 메시지 전송
  const sendMessage = (roomId, message, messageType = 'text', replyTo = null) => {
    if (socket && isConnected) {
      socket.emit('chat:send_message', {
        roomId,
        message,
        messageType,
        replyTo
      });
    }
  };

  // 메시지 수정
  const editMessage = (messageId, newMessage) => {
    if (socket && isConnected) {
      socket.emit('chat:edit_message', { messageId, newMessage });
    }
  };

  // 메시지 삭제
  const deleteMessage = (messageId) => {
    if (socket && isConnected) {
      socket.emit('chat:delete_message', { messageId });
    }
  };

  // 타이핑 상태 전송
  const sendTyping = (roomId, isTyping) => {
    if (socket && isConnected) {
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

  // 읽음 상태 업데이트
  const markAsRead = (roomId) => {
    if (socket && isConnected) {
      socket.emit('chat:mark_read', { roomId });
      setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
    }
  };

  // 1:1 채팅 초대
  const inviteDirectChat = (targetUserId) => {
    if (socket && isConnected) {
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