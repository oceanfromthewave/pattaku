import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin.replace(/^http/, 'ws') 
  : 'http://localhost:5000'; // 서버 주소에 맞게 변경

const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false, // 수동으로 연결
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ Socket connected', socket.id);
  const token = localStorage.getItem('token');
  if (token) {
    socket.emit('authenticate', token);
  }
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected', reason);
});

socket.on('connect_error', (error) => {
  console.error('🚨 Socket connection error', error);
});

socket.on('authenticated', (data) => {
  if (data.success) {
    console.log('🔑 Socket authenticated', data.userId);
  } else {
    console.error('🚫 Socket authentication failed', data.error);
    // 인증 실패 시 토큰 제거 등 추가 처리 필요
  }
});

export default socket;
