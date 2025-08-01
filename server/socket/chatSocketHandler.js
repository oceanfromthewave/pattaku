const jwt = require('jsonwebtoken');
const chatMessageModel = require('../models/chatMessageModel');
const chatRoomModel = require('../models/chatRoomModel');

class ChatSocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> { socketId, nickname, rooms: Set() }
    this.setupChatEvents();
  }

  setupChatEvents() {
    this.io.on('connection', (socket) => {
      console.log('🔌 채팅 소켓 연결:', socket.id);

      // 사용자 인증
      socket.on('chat:authenticate', async (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          socket.nickname = decoded.nickname;

          // 연결된 사용자 정보 저장
          this.connectedUsers.set(decoded.id, {
            socketId: socket.id,
            nickname: decoded.nickname,
            rooms: new Set()
          });

          console.log(`👤 채팅 사용자 인증: ${decoded.nickname} (${decoded.id})`);
          socket.emit('chat:authenticated', { success: true, userId: decoded.id });

          // 사용자의 채팅방 목록 조회 및 자동 참여
          const userRooms = await chatRoomModel.getUserRoomsAsync(decoded.id);
          for (const room of userRooms) {
            socket.join(`room_${room.id}`);
            this.connectedUsers.get(decoded.id).rooms.add(room.id);
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

          // 데이터베이스에 참여 기록
          await chatRoomModel.joinRoomAsync(roomId, socket.userId);

          // 소켓 방 참여
          socket.join(`room_${roomId}`);
          this.connectedUsers.get(socket.userId).rooms.add(roomId);

          // 참여 알림
          socket.to(`room_${roomId}`).emit('chat:user_joined', {
            userId: socket.userId,
            nickname: socket.nickname,
            roomId
          });

          socket.emit('chat:joined_room', { roomId });
          console.log(`📥 사용자 ${socket.nickname}이 방 ${roomId}에 참여`);

        } catch (error) {
          console.error('채팅방 참여 오류:', error);
          socket.emit('chat:error', { message: '채팅방 참여에 실패했습니다.' });
        }
      });

      // 채팅방 나가기
      socket.on('chat:leave_room', async (data) => {
        try {
          const { roomId } = data;
          if (!socket.userId) return;

          // 데이터베이스에서 참여 해제
          await chatRoomModel.leaveRoomAsync(roomId, socket.userId);

          // 소켓 방 나가기
          socket.leave(`room_${roomId}`);
          this.connectedUsers.get(socket.userId).rooms.delete(roomId);

          // 나가기 알림
          socket.to(`room_${roomId}`).emit('chat:user_left', {
            userId: socket.userId,
            nickname: socket.nickname,
            roomId
          });

          socket.emit('chat:left_room', { roomId });
          console.log(`📤 사용자 ${socket.nickname}이 방 ${roomId}에서 나감`);

        } catch (error) {
          console.error('채팅방 나가기 오류:', error);
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

          console.log(`💬 메시지 전송: ${socket.nickname} -> 방 ${roomId}`);

        } catch (error) {
          console.error('메시지 전송 오류:', error);
          socket.emit('chat:error', { message: '메시지 전송에 실패했습니다.' });
        }
      });

      // 메시지 수정
      socket.on('chat:edit_message', async (data) => {
        try {
          const { messageId, newMessage } = data;
          if (!socket.userId) return;

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
          }

        } catch (error) {
          console.error('메시지 수정 오류:', error);
          socket.emit('chat:error', { message: '메시지 수정에 실패했습니다.' });
        }
      });

      // 메시지 삭제
      socket.on('chat:delete_message', async (data) => {
        try {
          const { messageId } = data;
          if (!socket.userId) return;

          const message = await chatMessageModel.getMessageByIdAsync(messageId);
          if (message) {
            await chatMessageModel.deleteMessageAsync(messageId, socket.userId);

            // 해당 채팅방의 모든 사용자에게 삭제 알림
            this.io.to(`room_${message.room_id}`).emit('chat:message_deleted', {
              messageId
            });
          }

        } catch (error) {
          console.error('메시지 삭제 오류:', error);
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

      // 읽음 상태 업데이트
      socket.on('chat:mark_read', async (data) => {
        try {
          const { roomId } = data;
          if (!socket.userId) return;

          await chatMessageModel.updateLastReadAsync(roomId, socket.userId);

          // 채팅방의 다른 사용자들에게 읽음 상태 알림
          socket.to(`room_${roomId}`).emit('chat:message_read', {
            userId: socket.userId,
            roomId
          });

        } catch (error) {
          console.error('읽음 상태 업데이트 오류:', error);
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
          }

        } catch (error) {
          console.error('1:1 채팅 초대 오류:', error);
        }
      });

      // 연결 해제
      socket.on('disconnect', () => {
        if (socket.userId) {
          // 오프라인 알림
          socket.broadcast.emit('chat:user_offline', {
            userId: socket.userId,
            nickname: socket.nickname
          });

          this.connectedUsers.delete(socket.userId);
          console.log(`👋 채팅 사용자 연결 해제: ${socket.nickname} (${socket.userId})`);
        }
      });
    });
  }

  // 특정 사용자에게 채팅 알림 전송
  sendChatNotification(userId, notification) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.io.to(user.socketId).emit('chat:notification', notification);
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
}

module.exports = ChatSocketHandler;