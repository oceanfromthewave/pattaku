// socketHandler.js - WebSocket 이벤트 처리
const jwt = require('jsonwebtoken');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> socketId 매핑
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log('🔌 클라이언트 연결:', socket.id);

      // 사용자 인증 및 등록
      socket.on('authenticate', (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          socket.nickname = decoded.nickname;
          
          // 사용자 소켓 등록
          this.userSockets.set(decoded.id, socket.id);
          
          console.log(`👤 사용자 인증 완료: ${decoded.nickname} (${decoded.id})`);
          socket.emit('authenticated', { success: true, userId: decoded.id });
          
        } catch (error) {
          console.error('❌ 소켓 인증 실패:', error);
          socket.emit('authenticated', { success: false, error: '인증 실패' });
        }
      });

      // 연결 해제
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          console.log(`👋 사용자 연결 해제: ${socket.nickname} (${socket.userId})`);
        }
      });

      // 에러 처리
      socket.on('error', (error) => {
        console.error('🚨 소켓 에러:', error);
      });
    });
  }

  // 특정 사용자에게 알림 전송
  sendNotificationToUser(userId, notification) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('notification', notification);
        console.log(`🔔 알림 전송 완료: ${notification.title} -> 사용자 ${userId}`);
        return true;
      }
    }
    console.log(`⚠️ 사용자 ${userId}가 오프라인 상태입니다.`);
    return false;
  }

  // 여러 사용자에게 알림 전송
  sendNotificationToUsers(userIds, notification) {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (this.sendNotificationToUser(userId, notification)) {
        sentCount++;
      }
    });
    return sentCount;
  }

  // 온라인 사용자 목록 반환
  getOnlineUsers() {
    return Array.from(this.userSockets.keys());
  }

  // 특정 사용자가 온라인인지 확인
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }
}

module.exports = SocketHandler;
