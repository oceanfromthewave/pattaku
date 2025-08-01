import { API_BASE_URL } from './config';

const token = localStorage.getItem('token');
const headers = {
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` })
};

// 채팅방 관련 API
export const chatRoomApi = {
  // 모든 채팅방 조회
  getAllRooms: async () => {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms`);
    if (!response.ok) throw new Error('채팅방 목록 조회 실패');
    return response.json();
  },

  // 타입별 채팅방 조회
  getRoomsByType: async (type) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/type/${type}`);
    if (!response.ok) throw new Error('타입별 채팅방 조회 실패');
    return response.json();
  },

  // 사용자 참여 채팅방 조회
  getUserRooms: async () => {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/my`, { headers });
    if (!response.ok) throw new Error('참여 채팅방 조회 실패');
    return response.json();
  },

  // 채팅방 상세 조회
  getRoomById: async (roomId) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}`, { headers });
    if (!response.ok) throw new Error('채팅방 상세 조회 실패');
    return response.json();
  },

  // 채팅방 생성
  createRoom: async (roomData) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
      method: 'POST',
      headers,
      body: JSON.stringify(roomData)
    });
    if (!response.ok) throw new Error('채팅방 생성 실패');
    return response.json();
  },

  // 채팅방 참여
  joinRoom: async (roomId) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/join`, {
      method: 'POST',
      headers
    });
    if (!response.ok) throw new Error('채팅방 참여 실패');
    return response.json();
  },

  // 채팅방 나가기
  leaveRoom: async (roomId) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/leave`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('채팅방 나가기 실패');
    return response.json();
  },

  // 1:1 채팅방 생성/조회
  getOrCreateDirectMessage: async (targetUserId) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/direct/${targetUserId}`, { headers });
    if (!response.ok) throw new Error('1:1 채팅방 생성/조회 실패');
    return response.json();
  }
};

// 채팅 메시지 관련 API
export const chatMessageApi = {
  // 채팅방 메시지 조회
  getRoomMessages: async (roomId, limit = 50, offset = 0) => {
    const response = await fetch(
      `${API_BASE_URL}/api/chat/rooms/${roomId}/messages?limit=${limit}&offset=${offset}`,
      { headers }
    );
    if (!response.ok) throw new Error('메시지 조회 실패');
    return response.json();
  },

  // 메시지 전송 (REST API - Socket.io를 주로 사용)
  sendMessage: async (roomId, messageData) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(messageData)
    });
    if (!response.ok) throw new Error('메시지 전송 실패');
    return response.json();
  },

  // 메시지 수정
  updateMessage: async (messageId, message) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/messages/${messageId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ message })
    });
    if (!response.ok) throw new Error('메시지 수정 실패');
    return response.json();
  },

  // 메시지 삭제
  deleteMessage: async (messageId) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/messages/${messageId}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('메시지 삭제 실패');
    return response.json();
  },

  // 안읽은 메시지 수 조회
  getUnreadCount: async (roomId) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/unread`, { headers });
    if (!response.ok) throw new Error('안읽은 메시지 수 조회 실패');
    return response.json();
  },

  // 전체 안읽은 메시지 수 조회
  getTotalUnreadCount: async () => {
    const response = await fetch(`${API_BASE_URL}/api/chat/unread-total`, { headers });
    if (!response.ok) throw new Error('전체 안읽은 메시지 수 조회 실패');
    return response.json();
  }
};