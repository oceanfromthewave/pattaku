// routes/chatRoutes.js - 채팅 API 라우터
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const chatRoomModel = require('../models/chatRoomModel');
const chatMessageModel = require('../models/chatMessageModel');
const auth = require('../middleware/auth');

// 모든 채팅방 목록 조회
router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await chatRoomModel.getAllRoomsAsync();
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('채팅방 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '채팅방 목록을 불러오는데 실패했습니다.' });
  }
});

// 특정 채팅방 정보 조회
router.get('/rooms/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await chatRoomModel.getRoomByIdAsync(roomId);
    
    if (!room) {
      return res.status(404).json({ success: false, message: '채팅방을 찾을 수 없습니다.' });
    }

    // 참여자 목록도 함께 조회
    const participants = await chatRoomModel.getRoomParticipantsAsync(roomId);
    room.participants = participants;

    res.json({ success: true, room });
  } catch (error) {
    console.error('채팅방 정보 조회 오류:', error);
    res.status(500).json({ success: false, message: '채팅방 정보를 불러오는데 실패했습니다.' });
  }
});

// 채팅방 생성
router.post('/rooms', auth, async (req, res) => {
  try {
    const { name, description, type = 'topic', topic } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '채팅방 이름을 입력해주세요.' });
    }

    const roomId = await chatRoomModel.createRoomAsync({
      name: name.trim(),
      description: description?.trim() || '',
      type,
      topic: topic?.trim() || null,
      created_by: userId
    });

    // 생성자를 채팅방에 자동 참여시킴
    await chatRoomModel.joinRoomAsync(roomId, userId);

    const room = await chatRoomModel.getRoomByIdAsync(roomId);
    res.status(201).json({ success: true, room });
  } catch (error) {
    console.error('채팅방 생성 오류:', error);
    res.status(500).json({ success: false, message: '채팅방 생성에 실패했습니다.' });
  }
});

// 사용자의 참여 채팅방 목록
router.get('/my-rooms', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await chatRoomModel.getUserRoomsAsync(userId);
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('사용자 채팅방 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '참여 중인 채팅방 목록을 불러오는데 실패했습니다.' });
  }
});

// 채팅방 참여
router.post('/rooms/:roomId/join', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await chatRoomModel.getRoomByIdAsync(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: '채팅방을 찾을 수 없습니다.' });
    }

    await chatRoomModel.joinRoomAsync(roomId, userId);
    res.json({ success: true, message: '채팅방에 참여했습니다.' });
  } catch (error) {
    console.error('채팅방 참여 오류:', error);
    res.status(500).json({ success: false, message: '채팅방 참여에 실패했습니다.' });
  }
});

// 채팅방 나가기
router.post('/rooms/:roomId/leave', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    await chatRoomModel.leaveRoomAsync(roomId, userId);
    res.json({ success: true, message: '채팅방에서 나왔습니다.' });
  } catch (error) {
    console.error('채팅방 나가기 오류:', error);
    res.status(500).json({ success: false, message: '채팅방 나가기에 실패했습니다.' });
  }
});

// 채팅방 메시지 조회
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const messages = await chatMessageModel.getRoomMessagesAsync(roomId, limit, offset);
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('채팅 메시지 조회 오류:', error);
    res.status(500).json({ success: false, message: '메시지를 불러오는데 실패했습니다.' });
  }
});

// 1:1 채팅방 생성/찾기
router.post('/direct/:targetUserId', auth, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user.id;

    if (parseInt(targetUserId) === userId) {
      return res.status(400).json({ success: false, message: '자기 자신과는 채팅할 수 없습니다.' });
    }

    const directMessage = await chatRoomModel.getOrCreateDirectMessageAsync(userId, parseInt(targetUserId));
    res.json({ success: true, room: directMessage });
  } catch (error) {
    console.error('1:1 채팅방 생성 오류:', error);
    res.status(500).json({ success: false, message: '1:1 채팅방 생성에 실패했습니다.' });
  }
});

// 안읽은 메시지 수 조회
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const totalUnread = await chatMessageModel.getTotalUnreadCountAsync(userId);
    res.json({ success: true, unreadCount: totalUnread });
  } catch (error) {
    console.error('안읽은 메시지 수 조회 오류:', error);
    res.status(500).json({ success: false, message: '안읽은 메시지 수를 조회하는데 실패했습니다.' });
  }
});

// 타입별 채팅방 조회
router.get('/rooms/type/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['public', 'topic', 'private'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 채팅방 타입입니다.' });
    }

    const rooms = await chatRoomModel.getRoomsByTypeAsync(type);
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('타입별 채팅방 조회 오류:', error);
    res.status(500).json({ success: false, message: '채팅방 목록을 불러오는데 실패했습니다.' });
  }
});

// 채팅방 참여자 목록 조회
router.get('/rooms/:roomId/participants', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const participants = await chatRoomModel.getRoomParticipantsAsync(roomId);
    res.json({ success: true, participants });
  } catch (error) {
    console.error('채팅방 참여자 조회 오류:', error);
    res.status(500).json({ success: false, message: '참여자 목록을 불러오는데 실패했습니다.' });
  }
});

module.exports = router;
