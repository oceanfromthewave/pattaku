const jwt = require('jsonwebtoken');
const chatMessageModel = require('../models/chatMessageModel');
const chatRoomModel = require('../models/chatRoomModel');

class ChatSocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> { socketId, nickname, rooms: Set() }
    this.pendingReadUpdates = new Map(); // roomId -> Set(userId) - 배치 처리용
    this.readUpdateTimer = null;
    this.cleanupTimer = null;
    this.maxConnections = process.env.NODE_ENV === 'production' ? 500 : 100;
    this.setupChatEvents();
    
    // 배치 읽음 상태 업데이트 타이머 시작
    this.startReadUpdateBatcher();
    
    // 주기적 메모리 정리
    this.startMemoryCleanup();
    
    console.log('🔌 ChatSocketHandler 초기화 완료');
  }

  // 배치 읽음 상태 업데이트 시스템
  startReadUpdateBatcher() {
    this.readUpdateTimer = setInterval(async () => {
      if (this.pendingReadUpdates.size > 0) {
        await this.processPendingReadUpdates();
      }
    }, 10000); // 10초마다 배치 처리 (더 안정적)
    
    console.log('🔄 배치 읽음 상태 업데이트 시스템 시작 (10초 간격)');
  }

  async processPendingReadUpdates() {
    const updates = [];
    
    for (const [roomId, userIds] of this.pendingReadUpdates.entries()) {
      for (const userId of userIds) {
        updates.push({ roomId: parseInt(roomId), userId: parseInt(userId) });
      }
    }

    if (updates.length > 0) {
      try {
        console.log(`🗓️ 배치 읽음 상태 업데이트 시작: ${updates.length}건`);
        await chatMessageModel.batchUpdateLastReadAsync(updates);
        console.log(`✅ 배치 읽음 상태 업데이트 완료: ${updates.length}건`);
      } catch (error) {
        console.error('❌ 배치 읽음 상태 업데이트 오류:', error);
      }
    }

    this.pendingReadUpdates.clear();
  }

  // 메모리 정리 시스템
  startMemoryCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupDisconnectedUsers();
      this.cleanupEmptyRooms();
      this.logMemoryUsage();
    }, 300000); // 5분마다 정리
    
    console.log('🧹 메모리 정리 시스템 시작 (5분 간격)');
  }

  cleanupDisconnectedUsers() {
    const beforeSize = this.connectedUsers.size;
    const now = Date.now();
    const timeoutThreshold = 300000; // 5분

    for (const [userId, userInfo] of this.connectedUsers.entries()) {
      const socket = this.io.sockets.sockets.get(userInfo.socketId);
      
      // 소켓이 존재하지 않거나 연결이 끊어진 경우
      if (!socket || !socket.connected) {
        // 마지막 활동 시간 체크
        const lastActivity = userInfo.lastActivity || userInfo.connectedAt || now;
        if (now - lastActivity > timeoutThreshold) {
          this.connectedUsers.delete(userId);
          console.log(`🗑️ 비활성 사용자 정리: ${userId}`);
        }
      }
    }

    const cleaned = beforeSize - this.connectedUsers.size;
    if (cleaned > 0) {
      console.log(`🧹 연결 해제된 사용자 ${cleaned}명 정리됨`);
    }
  }

  cleanupEmptyRooms() {
    // 빈 대기열 정리
    for (const [roomId, userIds] of this.pendingReadUpdates.entries()) {
      if (userIds.size === 0) {
        this.pendingReadUpdates.delete(roomId);
      }
    }
  }

  logMemoryUsage() {
    const memUsage = process.memoryUsage();
    const stats = {
      connectedUsers: this.connectedUsers.size,
      pendingUpdates: this.pendingReadUpdates.size,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      socketConnections: this.io.engine.clientsCount
    };

    // 연결 수가 임계값을 초과하면 경고
    if (stats.socketConnections > this.maxConnections * 0.8) {
      console.warn('⚠️ 소켓 연결 수 임계값 접근:', stats);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('📊 ChatSocket 메모리 상태:', stats);
    }
  }

  setupChatEvents() {
    this.io.on('connection', (socket) => {
      console.log('🔌 새로운 소켓 연결:', socket.id);

      // 소켓 에러 처리
      socket.on('error', (error) => {
        console.error('🚨 소켓 에러:', error);
      });

      // 사용자 인증
      socket.on('chat:authenticate', async (token) => {
        try {
          console.log('🔐 채팅 소켓 인증 시도:', socket.id);
          
          if (!token) {
            socket.emit('chat:authenticated', { success: false, error: '토큰이 없습니다' });
            return;
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          socket.nickname = decoded.nickname;

          // 기존 연결이 있다면 정리
          const existingUser = this.connectedUsers.get(decoded.id);
          if (existingUser) {
            const existingSocket = this.io.sockets.sockets.get(existingUser.socketId);
            if (existingSocket && existingSocket.id !== socket.id) {
              existingSocket.disconnect(true);
            }
          }

          // 연결된 사용자 정보 저장
          this.connectedUsers.set(decoded.id, {
            socketId: socket.id,
            nickname: decoded.nickname,
            rooms: new Set()
          });

          console.log(`✅ 채팅 사용자 인증 성공: ${decoded.nickname} (${decoded.id})`);
          socket.emit('chat:authenticated', { success: true, userId: decoded.id });

          // 사용자의 채팅방 목록 조회 및 자동 참여
          try {
            const userRooms = await chatRoomModel.getUserRoomsAsync(decoded.id);
            for (const room of userRooms) {
              socket.join(`room_${room.id}`);
              this.connectedUsers.get(decoded.id).rooms.add(room.id);
              console.log(`🏠 자동 참여: ${decoded.nickname} -> 방 ${room.id}`);
            }
          } catch (error) {
            console.error('❌ 사용자 채팅방 자동 참여 오류:', error);
          }

          // 온라인 사용자 알림
          socket.broadcast.emit('chat:user_online', {
            userId: decoded.id,
            nickname: decoded.nickname
          });

        } catch (error) {
          console.error('❌ 채팅 소켓 인증 실패:', error);
          socket.emit('chat:authenticated', { success: false, error: '인증 실패' });
        }
      });

      // 채팅방 참여
      socket.on('chat:join_room', async (data) => {
        try {
          const { roomId } = data;
          if (!socket.userId) {
            socket.emit('chat:error', { message: '인증이 필요합니다.' });
            return;
          }

          console.log(`🚪 채팅방 참여: ${socket.nickname} -> 방 ${roomId}`);

          // 데이터베이스에 참여 기록
          await chatRoomModel.joinRoomAsync(roomId, socket.userId);

          // 소켓 방 참여
          socket.join(`room_${roomId}`);
          const userInfo = this.connectedUsers.get(socket.userId);
          if (userInfo) {
            userInfo.rooms.add(roomId);
          }

          // 참여 알림
          socket.to(`room_${roomId}`).emit('chat:user_joined', {
            userId: socket.userId,
            nickname: socket.nickname,
            roomId
          });

          socket.emit('chat:joined_room', { roomId });
          console.log(`✅ 채팅방 참여 완료: ${socket.nickname} -> 방 ${roomId}`);

        } catch (error) {
          console.error('❌ 채팅방 참여 오류:', error);
          socket.emit('chat:error', { message: '채팅방 참여에 실패했습니다.' });
        }
      });

      // 채팅방 나가기
      socket.on('chat:leave_room', async (data) => {
        try {
          const { roomId } = data;
          if (!socket.userId) return;

          console.log(`🚪 채팅방 나가기: ${socket.nickname} -> 방 ${roomId}`);

          // 데이터베이스에서 참여 해제
          await chatRoomModel.leaveRoomAsync(roomId, socket.userId);

          // 소켓 방 나가기
          socket.leave(`room_${roomId}`);
          const userInfo = this.connectedUsers.get(socket.userId);
          if (userInfo) {
            userInfo.rooms.delete(roomId);
          }

          // 나가기 알림
          socket.to(`room_${roomId}`).emit('chat:user_left', {
            userId: socket.userId,
            nickname: socket.nickname,
            roomId
          });

          socket.emit('chat:left_room', { roomId });
          console.log(`✅ 채팅방 나가기 완료: ${socket.nickname} -> 방 ${roomId}`);

        } catch (error) {
          console.error('❌ 채팅방 나가기 오류:', error);
          socket.emit('chat:error', { message: '채팅방 나가기에 실패했습니다.' });
        }
      });

      // 메시지 전송
      socket.on('chat:send_message', async (data) => {
        try {
          const { roomId, message, messageType = 'text', replyTo = null } = data;
          if (!socket.userId) {
            socket.emit('chat:error', { message: '인증이 필요합니다.' });
            return;
          }

          if (!message || message.trim().length === 0) {
            socket.emit('chat:error', { message: '메시지 내용을 입력해주세요.' });
            return;
          }

          console.log(`💬 메시지 전송: ${socket.nickname} -> 방 ${roomId}: "${message.substring(0, 20)}..."`);

          // 데이터베이스에 메시지 저장
          const newMessage = await chatMessageModel.createMessageAsync({
            room_id: roomId,
            user_id: socket.userId,
            message: message.trim(),
            message_type: messageType,
            reply_to: replyTo
          });

          // 채팅방의 모든 사용자에게 메시지 전송
          this.io.to(`room_${roomId}`).emit('chat:new_message', {
            ...newMessage,
            sender_nickname: socket.nickname
          });

          console.log(`✅ 메시지 전송 완료: ${socket.nickname} -> 방 ${roomId}`);

        } catch (error) {
          console.error('❌ 메시지 전송 오류:', error);
          socket.emit('chat:error', { message: '메시지 전송에 실패했습니다.' });
        }
      });

      // 메시지 수정
      socket.on('chat:edit_message', async (data) => {
        try {
          const { messageId, newMessage } = data;
          if (!socket.userId) return;

          console.log(`✏️ 메시지 수정: ${socket.nickname} -> 메시지 ${messageId}`);

          await chatMessageModel.updateMessageAsync(messageId, socket.userId, newMessage);

          // 수정된 메시지 정보 조회
          const updatedMessage = await chatMessageModel.getMessageByIdAsync(messageId);
          if (updatedMessage) {
            // 해당 채팅방의 모든 사용자에게 수정 알림
            this.io.to(`room_${updatedMessage.room_id}`).emit('chat:message_edited', {
              messageId,
              newMessage,
              updatedAt: updatedMessage.updated_at
            });
            console.log(`✅ 메시지 수정 완료: ${messageId}`);
          }

        } catch (error) {
          console.error('❌ 메시지 수정 오류:', error);
          socket.emit('chat:error', { message: '메시지 수정에 실패했습니다.' });
        }
      });

      // 메시지 삭제
      socket.on('chat:delete_message', async (data) => {
        try {
          const { messageId } = data;
          if (!socket.userId) return;

          console.log(`🗑️ 메시지 삭제: ${socket.nickname} -> 메시지 ${messageId}`);

          const message = await chatMessageModel.getMessageByIdAsync(messageId);
          if (message) {
            await chatMessageModel.deleteMessageAsync(messageId, socket.userId);

            // 해당 채팅방의 모든 사용자에게 삭제 알림
            this.io.to(`room_${message.room_id}`).emit('chat:message_deleted', {
              messageId
            });
            console.log(`✅ 메시지 삭제 완료: ${messageId}`);
          }

        } catch (error) {
          console.error('❌ 메시지 삭제 오류:', error);
          socket.emit('chat:error', { message: '메시지 삭제에 실패했습니다.' });
        }
      });

      // 타이핑 상태
      socket.on('chat:typing', (data) => {
        const { roomId, isTyping } = data;
        if (!socket.userId) return;

        socket.to(`room_${roomId}`).emit('chat:user_typing', {
          userId: socket.userId,
          nickname: socket.nickname,
          isTyping
        });
      });

      // 읽음 상태 업데이트 (배치 처리로 개선)
      socket.on('chat:mark_read', async (data) => {
        try {
          const { roomId } = data;
          if (!socket.userId) return;

          // 배치 처리를 위해 대기열에 추가
          if (!this.pendingReadUpdates.has(roomId)) {
            this.pendingReadUpdates.set(roomId, new Set());
          }
          
          const wasEmpty = this.pendingReadUpdates.get(roomId).size === 0;
          this.pendingReadUpdates.get(roomId).add(socket.userId);

          // 첫 번째 사용자일 때만 로그
          if (wasEmpty) {
            console.log(`📖 읽음 상태 배치 대기열 추가: 방 ${roomId}`);
          }

          // 즉시 클라이언트에 읽음 상태 알림 (UX 개선)
          socket.to(`room_${roomId}`).emit('chat:message_read', {
            userId: socket.userId,
            roomId
          });

        } catch (error) {
          console.error('❌ 읽음 상태 처리 오류:', error);
          // 에러가 발생해도 클라이언트에게는 알리지 않음 (선택적 기능)
        }
      });

      // 1:1 채팅 초대
      socket.on('chat:invite_direct', async (data) => {
        try {
          const { targetUserId } = data;
          if (!socket.userId) return;

          const targetUser = this.connectedUsers.get(parseInt(targetUserId));
          if (targetUser) {
            this.io.to(targetUser.socketId).emit('chat:direct_invite', {
              fromUserId: socket.userId,
              fromNickname: socket.nickname
            });
            console.log(`💌 1:1 채팅 초대: ${socket.nickname} -> ${targetUser.nickname}`);
          }

        } catch (error) {
          console.error('❌ 1:1 채팅 초대 오류:', error);
        }
      });

      // 연결 해제
      socket.on('disconnect', () => {
        if (socket.userId) {
          console.log(`👋 채팅 사용자 연결 해제: ${socket.nickname} (${socket.userId})`);
          
          // 오프라인 알림
          socket.broadcast.emit('chat:user_offline', {
            userId: socket.userId,
            nickname: socket.nickname
          });

          // 연결된 사용자 목록에서 제거
          this.connectedUsers.delete(socket.userId);
          
          // 해당 사용자의 읽음 상태 업데이트 대기열도 정리
          for (const [roomId, userIds] of this.pendingReadUpdates.entries()) {
            userIds.delete(socket.userId);
            if (userIds.size === 0) {
              this.pendingReadUpdates.delete(roomId);
            }
          }
        }
      });
    });
  }

  // 특정 사용자에게 채팅 알림 전송
  sendChatNotification(userId, notification) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.io.to(user.socketId).emit('chat:notification', notification);
      console.log(`🔔 채팅 알림 전송: ${notification.title} -> 사용자 ${userId}`);
      return true;
    }
    return false;
  }

  // 온라인 사용자 목록 반환
  getOnlineUsers() {
    return Array.from(this.connectedUsers.entries()).map(([userId, userData]) => ({
      userId,
      nickname: userData.nickname,
      rooms: Array.from(userData.rooms)
    }));
  }

  // 특정 사용자가 온라인인지 확인
  isUserOnline(userId) {
    return this.connectedUsers.has(parseInt(userId));
  }

  // 정리 함수 (서버 종료시 호출)
  cleanup() {
    if (this.readUpdateTimer) {
      clearInterval(this.readUpdateTimer);
      this.readUpdateTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // 남은 읽음 상태 업데이트 처리
    if (this.pendingReadUpdates.size > 0) {
      this.processPendingReadUpdates();
    }
    
    // 메모리 정리
    this.connectedUsers.clear();
    this.pendingReadUpdates.clear();
    
    console.log('🧹 ChatSocketHandler 정리 완료');
  }
}

module.exports = ChatSocketHandler;