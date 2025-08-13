// api/chatApi.js - 개선된 채팅 API 클라이언트
import { apiRequest } from './config';

export const chatApi = {
  // 채팅방 관련
  rooms: {
    // 모든 채팅방 목록 조회
    getAll: async () => {
      const data = await apiRequest('/api/chat/rooms');
      return data.rooms || [];
    },

    // 내가 참여한 채팅방 목록
    getMy: async () => {
      const data = await apiRequest('/api/chat/my-rooms');
      return data.rooms || [];
    },

    // 특정 채팅방 정보 조회
    getById: async (roomId) => {
      const data = await apiRequest(`/api/chat/rooms/${roomId}`);
      return data.room;
    },

    // 채팅방 생성
    create: async (roomData) => {
      const data = await apiRequest('/api/chat/rooms', {
        method: 'POST',
        body: roomData
      });
      return data.room;
    },

    // 채팅방 참여
    join: async (roomId) => {
      return await apiRequest(`/api/chat/rooms/${roomId}/join`, {
        method: 'POST'
      });
    },

    // 채팅방 나가기
    leave: async (roomId) => {
      return await apiRequest(`/api/chat/rooms/${roomId}/leave`, {
        method: 'POST'
      });
    },

    // 타입별 채팅방 조회
    getByType: async (type) => {
      const data = await apiRequest(`/api/chat/rooms/type/${type}`);
      return data.rooms || [];
    },

    // 채팅방 참여자 목록
    getParticipants: async (roomId) => {
      const data = await apiRequest(`/api/chat/rooms/${roomId}/participants`);
      return data.participants || [];
    }
  },

  // 메시지 관련
  messages: {
    // 채팅방 메시지 조회
    getRoomMessages: async (roomId, page = 1, limit = 50) => {
      const data = await apiRequest(`/api/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`);
      return data.messages || [];
    },

    // 안읽은 메시지 수 조회
    getUnreadCount: async () => {
      const data = await apiRequest('/api/chat/unread-count');
      return data.unreadCount || 0;
    }
  },

  // 1:1 채팅 관련
  direct: {
    // 1:1 채팅방 생성/찾기
    createOrFind: async (targetUserId) => {
      const data = await apiRequest(`/api/chat/direct/${targetUserId}`, {
        method: 'POST'
      });
      return data.room;
    }
  }
};

// 채팅 유틸리티 함수들
export const chatUtils = {
  // 채팅방 타입 아이콘
  getRoomTypeIcon: (type) => {
    const iconMap = {
      'public': '🌐',
      'topic': '💭',
      'private': '🔒'
    };
    return iconMap[type] || '💬';
  },

  // 채팅방 타입 이름
  getRoomTypeName: (type) => {
    const nameMap = {
      'public': '전체 채팅방',
      'topic': '주제별 채팅방',
      'private': '비공개 채팅방'
    };
    return nameMap[type] || '채팅방';
  },

  // 메시지 시간 포맷팅
  formatMessageTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  },

  // 안읽은 메시지 수 포맷팅
  formatUnreadCount: (count) => {
    if (count === 0) return '';
    if (count < 100) return count.toString();
    return '99+';
  },

  // 메시지 그룹핑 (같은 사용자의 연속 메시지)
  groupMessages: (messages) => {
    const grouped = [];
    let currentGroup = null;

    messages.forEach(message => {
      if (!currentGroup || 
          currentGroup.userId !== message.user_id ||
          (new Date(message.created_at) - new Date(currentGroup.lastMessageTime)) > 300000) { // 5분
        currentGroup = {
          userId: message.user_id,
          nickname: message.sender_nickname,
          profileImage: message.sender_profile,
          lastMessageTime: message.created_at,
          messages: [message]
        };
        grouped.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
        currentGroup.lastMessageTime = message.created_at;
      }
    });

    return grouped;
  },

  // 메시지 검색
  searchMessages: (messages, query) => {
    if (!query.trim()) return messages;
    
    const searchTerm = query.toLowerCase();
    return messages.filter(message => 
      message.message.toLowerCase().includes(searchTerm) ||
      message.sender_nickname.toLowerCase().includes(searchTerm)
    );
  }
};

// 채팅 이벤트 타입 정의
export const CHAT_EVENTS = {
  // 연결 관련
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'chat:authenticate',
  AUTHENTICATED: 'chat:authenticated',
  
  // 채팅방 관련
  JOIN_ROOM: 'chat:join_room',
  LEAVE_ROOM: 'chat:leave_room',
  JOINED_ROOM: 'chat:joined_room',
  LEFT_ROOM: 'chat:left_room',
  USER_JOINED: 'chat:user_joined',
  USER_LEFT: 'chat:user_left',
  
  // 메시지 관련
  SEND_MESSAGE: 'chat:send_message',
  NEW_MESSAGE: 'chat:new_message',
  EDIT_MESSAGE: 'chat:edit_message',
  MESSAGE_EDITED: 'chat:message_edited',
  DELETE_MESSAGE: 'chat:delete_message',
  MESSAGE_DELETED: 'chat:message_deleted',
  
  // 상태 관련
  TYPING: 'chat:typing',
  USER_TYPING: 'chat:user_typing',
  MARK_READ: 'chat:mark_read',
  MESSAGE_READ: 'chat:message_read',
  
  // 사용자 상태
  USER_ONLINE: 'chat:user_online',
  USER_OFFLINE: 'chat:user_offline',
  
  // 1:1 채팅
  INVITE_DIRECT: 'chat:invite_direct',
  DIRECT_INVITE: 'chat:direct_invite',
  
  // 알림 및 에러
  NOTIFICATION: 'chat:notification',
  ERROR: 'chat:error'
};
