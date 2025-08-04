import { API_BASE_URL } from './config';

// 헤더 생성 함수 (항상 최신 토큰 사용)
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// 채팅방 관련 API
export const chatRoomApi = {
  // 모든 채팅방 조회
  getAllRooms: async () => {
    console.log('🌐 API 요청: 모든 채팅방 조회');
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      console.error('❌ 채팅방 목록 조회 실패:', response.status, response.statusText);
      throw new Error('채팅방 목록 조회 실패');
    }
    const data = await response.json();
    console.log('✅ 채팅방 목록 조회 성공:', data.length, '개');
    return data;
  },

  // 타입별 채팅방 조회
  getRoomsByType: async (type) => {
    console.log('🌐 API 요청: 타입별 채팅방 조회', type);
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/type/${type}`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      console.error('❌ 타입별 채팅방 조회 실패:', response.status, response.statusText);
      throw new Error('타입별 채팅방 조회 실패');
    }
    const data = await response.json();
    console.log('✅ 타입별 채팅방 조회 성공:', data.length, '개');
    return data;
  },

  // 사용자 참여 채팅방 조회
  getUserRooms: async () => {
    console.log('🌐 API 요청: 내 채팅방 조회');
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/my`, { 
      headers: getHeaders() 
    });
    if (!response.ok) {
      console.error('❌ 참여 채팅방 조회 실패:', response.status, response.statusText);
      throw new Error('참여 채팅방 조회 실패');
    }
    const data = await response.json();
    console.log('✅ 내 채팅방 조회 성공:', data.length, '개');
    return data;
  },

  // 채팅방 상세 조회
  getRoomById: async (roomId) => {
    console.log('🌐 API 요청: 채팅방 상세 조회', roomId);
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      console.error('❌ 채팅방 상세 조회 실패:', response.status, response.statusText);
      throw new Error('채팅방 상세 조회 실패');
    }
    const data = await response.json();
    console.log('✅ 채팅방 상세 조회 성공:', data.name);
    return data;
  },

  // 채팅방 생성
  createRoom: async (roomData) => {
    console.log('🌐 API 요청: 채팅방 생성', roomData);
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(roomData)
    });
    if (!response.ok) {
      console.error('❌ 채팅방 생성 실패:', response.status, response.statusText);
      throw new Error('채팅방 생성 실패');
    }
    const data = await response.json();
    console.log('✅ 채팅방 생성 성공:', data);
    return data;
  },

  // 채팅방 참여
  joinRoom: async (roomId) => {
    console.log('🌐 API 요청: 채팅방 참여', roomId);
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/join`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) {
      console.error('❌ 채팅방 참여 실패:', response.status, response.statusText);
      throw new Error('채팅방 참여 실패');
    }
    const data = await response.json();
    console.log('✅ 채팅방 참여 성공:', data);
    return data;
  },

  // 채팅방 나가기
  leaveRoom: async (roomId) => {
    console.log('🌐 API 요청: 채팅방 나가기', roomId);
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) {
      console.error('❌ 채팅방 나가기 실패:', response.status, response.statusText);
      throw new Error('채팅방 나가기 실패');
    }
    const data = await response.json();
    console.log('✅ 채팅방 나가기 성공:', data);
    return data;
  },

  // 1:1 채팅방 생성/조회
  getOrCreateDirectMessage: async (targetUserId) => {
    console.log('🌐 API 요청: 1:1 채팅방 생성/조회', targetUserId);
    const response = await fetch(`${API_BASE_URL}/api/chat/direct/${targetUserId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) {
      console.error('❌ 1:1 채팅방 생성/조회 실패:', response.status, response.statusText);
      throw new Error('1:1 채팅방 생성/조회 실패');
    }
    const data = await response.json();
    console.log('✅ 1:1 채팅방 생성/조회 성공:', data);
    return data;
  }
};

// 채팅 메시지 관련 API
export const chatMessageApi = {
  // 채팅방 메시지 조회
  getRoomMessages: async (roomId, limit = 50, offset = 0) => {
    console.log('🌐 API 요청: 채팅방 메시지 조회', roomId);
    const response = await fetch(
      `${API_BASE_URL}/api/chat/rooms/${roomId}/messages?limit=${limit}&offset=${offset}`,
      { headers: getHeaders() }
    );
    if (!response.ok) {
      console.error('❌ 채팅방 메시지 조회 실패:', response.status, response.statusText);
      throw new Error('채팅방 메시지 조회 실패');
    }
    const data = await response.json();
    console.log('✅ 채팅방 메시지 조회 성공:', data.length, '개');
    return data;
  },

  // 안읽은 메시지 수 조회
  getUnreadCount: async (roomId) => {
    console.log('🌐 API 요청: 안읽은 메시지 수 조회', roomId);
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/unread`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      console.error('❌ 안읽은 메시지 수 조회 실패:', response.status, response.statusText);
      throw new Error('안읽은 메시지 수 조회 실패');
    }
    const data = await response.json();
    console.log('✅ 안읽은 메시지 수 조회 성공:', data);
    return data;
  }
};