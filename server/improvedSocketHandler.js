// improvedSocketHandler.js - 향상된 WebSocket 이벤트 처리
const jwt = require('jsonwebtoken');

class ImprovedSocketHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> socketId 매핑
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      reconnections: 0
    };
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      this.connectionStats.totalConnections++;
      this.connectionStats.activeConnections++;
      
      console.log(`🔌 클라이언트 연결: ${socket.id} (총 ${this.connectionStats.activeConnections}개 연결)`);

      // 사용자 인증 및 등록
      socket.on('authenticate', (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.id;
          
          // 기존 연결이 있다면 교체 (중복 연결 방지)
          const existingSocketId = this.userSockets.get(userId);
          if (existingSocketId && this.io.sockets.sockets.has(existingSocketId)) {
            const existingSocket = this.io.sockets.sockets.get(existingSocketId);
            existingSocket.disconnect();
            this.connectionStats.reconnections++;
            console.log(`🔄 기존 연결 교체: 사용자 ${decoded.nickname} (${userId})`);
          }
          
          socket.userId = userId;
          socket.nickname = decoded.nickname;
          socket.joinedAt = new Date();
          
          // 사용자 소켓 등록
          this.userSockets.set(userId, socket.id);
          
          console.log(`👤 사용자 인증 완료: ${decoded.nickname} (${userId})`);
          
          // 인증 성공 응답
          socket.emit('authenticated', { 
            success: true, 
            userId: userId,
            timestamp: new Date(),
            connectionStats: this.getPublicStats()
          });
          
          // 사용자별 룸 참가 (개인 알림용)
          socket.join(`user_${userId}`);
          
          // 읽지 않은 알림 개수 전송 (선택사항)
          this.sendUnreadCount(userId);
          
        } catch (error) {
          console.error('❌ 소켓 인증 실패:', error.message);
          socket.emit('authenticated', { 
            success: false, 
            error: '인증 실패',
            message: error.message 
          });
        }
      });

      // 핑-퐁 (연결 상태 확인)
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });

      // 알림 읽음 확인
      socket.on('notification_read', (data) => {
        if (socket.userId) {
          console.log(`📖 알림 읽음 확인: 사용자 ${socket.userId}, 알림 ID ${data.notificationId}`);
          // 필요시 추가 처리
        }
      });

      // 연결 해제
      socket.on('disconnect', (reason) => {
        this.connectionStats.activeConnections--;
        
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          const sessionDuration = socket.joinedAt ? 
            Math.round((new Date() - socket.joinedAt) / 1000) : 0;
          
          console.log(`👋 사용자 연결 해제: ${socket.nickname} (${socket.userId}) - ${reason} - 세션시간: ${sessionDuration}초`);
        } else {
          console.log(`👋 익명 연결 해제: ${socket.id} - ${reason}`);
        }
      });

      // 에러 처리
      socket.on('error', (error) => {
        console.error(`🚨 소켓 에러 (${socket.id}):`, error);
      });

      // 연결 직후 환영 메시지
      socket.emit('welcome', {
        message: 'Pattaku 실시간 알림 서버에 연결되었습니다.',
        timestamp: new Date(),
        serverVersion: '2.0'
      });
    });
  }

  // 특정 사용자에게 알림 전송 (개선된 버전)
  sendNotificationToUser(userId, notification) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        // 개인 룸으로 전송 (더 안전함)
        this.io.to(`user_${userId}`).emit('notification', {
          ...notification,
          receivedAt: new Date(),
          serverId: process.env.SERVER_ID || 'pattaku-server'
        });
        
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
    const results = [];
    
    userIds.forEach(userId => {
      const success = this.sendNotificationToUser(userId, notification);
      results.push({ userId, success });
      if (success) sentCount++;
    });
    
    console.log(`📤 대량 알림 전송: ${sentCount}/${userIds.length}명에게 전송 완료`);
    return { sentCount, results };
  }

  // 전체 사용자에게 공지사항 전송
  broadcastAnnouncement(announcement) {
    const onlineCount = this.userSockets.size;
    
    this.io.emit('announcement', {
      ...announcement,
      timestamp: new Date(),
      recipientCount: onlineCount
    });
    
    console.log(`📢 공지사항 전송: "${announcement.title}" -> ${onlineCount}명`);
    return onlineCount;
  }

  // 읽지 않은 알림 개수 전송
  async sendUnreadCount(userId) {
    try {
      // 실제 구현에서는 notificationModel.getUnreadCount(userId) 호출
      // const unreadCount = await notificationModel.getUnreadCount(userId);
      const unreadCount = 0; // 임시값
      
      this.sendNotificationToUser(userId, {
        type: 'unread_count_update',
        unreadCount,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('읽지 않은 알림 개수 전송 실패:', error);
    }
  }

  // 온라인 사용자 목록 반환
  getOnlineUsers() {
    return Array.from(this.userSockets.keys());
  }

  // 특정 사용자가 온라인인지 확인
  isUserOnline(userId) {
    const socketId = this.userSockets.get(userId);
    if (!socketId) return false;
    
    const socket = this.io.sockets.sockets.get(socketId);
    return socket && socket.connected;
  }

  // 연결 통계 (공개용)
  getPublicStats() {
    return {
      onlineUsers: this.userSockets.size,
      serverUptime: process.uptime(),
      timestamp: new Date()
    };
  }

  // 연결 통계 (관리자용)
  getDetailedStats() {
    const connectedSockets = Array.from(this.io.sockets.sockets.values())
      .filter(socket => socket.connected);
    
    return {
      ...this.connectionStats,
      currentOnlineUsers: this.userSockets.size,
      connectedSockets: connectedSockets.length,
      authenticatedUsers: connectedSockets.filter(s => s.userId).length,
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date()
    };
  }

  // 특정 사용자 강제 연결 해제
  disconnectUser(userId, reason = 'Admin disconnect') {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(reason);
        console.log(`🔌 사용자 강제 연결 해제: ${userId} - ${reason}`);
        return true;
      }
    }
    return false;
  }

  // 서버 종료시 정리
  cleanup() {
    console.log('🧹 소켓 핸들러 정리 중...');
    
    // 모든 연결된 클라이언트에게 서버 종료 알림
    this.io.emit('server_shutdown', {
      message: '서버가 종료됩니다. 잠시 후 다시 연결해주세요.',
      timestamp: new Date()
    });
    
    // 연결 강제 종료
    setTimeout(() => {
      this.io.disconnectSockets(true);
      console.log('✅ 모든 소켓 연결 정리 완료');
    }, 1000);
  }
}

module.exports = ImprovedSocketHandler;
