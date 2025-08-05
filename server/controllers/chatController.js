const chatRoomModel = require('../models/chatRoomModel');
const chatMessageModel = require('../models/chatMessageModel');

// 모든 채팅방 조회
exports.getAllRooms = async (req, res) => {
  try {
    console.log('📋 모든 채팅방 조회 요청');
    const rooms = await chatRoomModel.getAllRoomsAsync();
    console.log(`✅ 채팅방 ${rooms.length}개 조회됨`);
    res.json(rooms);
  } catch (error) {
    console.error('❌ 채팅방 목록 조회 오류:', error);
    res.status(500).json({ error: '채팅방 목록을 불러오는데 실패했습니다.' });
  }
};

// 타입별 채팅방 조회
exports.getRoomsByType = async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`📋 ${type} 타입 채팅방 조회 요청`);
    const rooms = await chatRoomModel.getRoomsByTypeAsync(type);
    console.log(`✅ ${type} 타입 채팅방 ${rooms.length}개 조회됨`);
    res.json(rooms);
  } catch (error) {
    console.error('❌ 타입별 채팅방 조회 오류:', error);
    res.status(500).json({ error: '채팅방을 불러오는데 실패했습니다.' });
  }
};

// 채팅방 상세 조회
exports.getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log(`📋 채팅방 상세 조회 요청: ${roomId}`);
    
    const room = await chatRoomModel.getRoomByIdAsync(roomId);
    
    if (!room) {
      console.log(`❌ 채팅방을 찾을 수 없음: ${roomId}`);
      return res.status(404).json({ error: '채팅방을 찾을 수 없습니다.' });
    }

    // 참여자 목록 조회 (오류 발생시 빈 배열로 처리)
    try {
      const participants = await chatRoomModel.getRoomParticipantsAsync(roomId);
      room.participants = participants;
      console.log(`✅ 채팅방 상세 조회 성공: ${room.name} (참여자 ${participants.length}명)`);
    } catch (participantError) {
      console.warn(`⚠️ 참여자 조회 실패, 빈 배열로 설정:`, participantError.message);
      room.participants = [];
      console.log(`✅ 채팅방 상세 조회 성공: ${room.name} (참여자 조회 실패)`);
    }

    res.json(room);
  } catch (error) {
    console.error('❌ 채팅방 상세 조회 오류:', error);
    res.status(500).json({ error: '채팅방 정보를 불러오는데 실패했습니다.' });
  }
};

// 채팅방 생성
exports.createRoom = async (req, res) => {
  try {
    const { name, description, type, topic } = req.body;
    const userId = req.user?.id;

    console.log('🏗️ 채팅방 생성 요청:', { name, type, topic, userId });

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    if (!name || !type) {
      return res.status(400).json({ error: '채팅방 이름과 타입은 필수입니다.' });
    }

    const roomId = await chatRoomModel.createRoomAsync({
      name,
      description,
      type,
      topic,
      created_by: userId
    });

    // 생성자를 채팅방에 자동 참여
    await chatRoomModel.joinRoomAsync(roomId, userId);

    console.log(`✅ 채팅방 생성 성공: ${name} (ID: ${roomId})`);
    res.status(201).json({ 
      message: '채팅방이 생성되었습니다.',
      roomId 
    });
  } catch (error) {
    console.error('❌ 채팅방 생성 오류:', error);
    res.status(500).json({ error: '채팅방 생성에 실패했습니다.' });
  }
};

// 채팅방 참여
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    console.log(`🚪 채팅방 참여 요청: 사용자 ${userId} -> 방 ${roomId}`);

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 채팅방 존재 확인
    const room = await chatRoomModel.getRoomByIdAsync(roomId);
    if (!room) {
      console.log(`❌ 존재하지 않는 채팅방: ${roomId}`);
      return res.status(404).json({ error: '채팅방을 찾을 수 없습니다.' });
    }

    await chatRoomModel.joinRoomAsync(roomId, userId);

    console.log(`✅ 채팅방 참여 성공: 사용자 ${userId} -> 방 ${roomId}`);
    res.json({ message: '채팅방에 참여했습니다.' });
  } catch (error) {
    console.error('❌ 채팅방 참여 오류:', error);
    res.status(500).json({ error: '채팅방 참여에 실패했습니다.' });
  }
};

// 채팅방 나가기
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    console.log(`🚪 채팅방 나가기 요청: 사용자 ${userId} -> 방 ${roomId}`);

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    await chatRoomModel.leaveRoomAsync(roomId, userId);

    console.log(`✅ 채팅방 나가기 성공: 사용자 ${userId} -> 방 ${roomId}`);
    res.json({ message: '채팅방에서 나갔습니다.' });
  } catch (error) {
    console.error('❌ 채팅방 나가기 오류:', error);
    res.status(500).json({ error: '채팅방 나가기에 실패했습니다.' });
  }
};

// 사용자 참여 채팅방 목록
exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.user?.id;

    console.log(`📋 사용자 채팅방 목록 조회: ${userId}`);

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const rooms = await chatRoomModel.getUserRoomsAsync(userId);
    console.log(`✅ 사용자 채팅방 ${rooms.length}개 조회됨`);
    res.json(rooms);
  } catch (error) {
    console.error('❌ 사용자 채팅방 조회 오류:', error);
    res.status(500).json({ error: '채팅방 목록을 불러오는데 실패했습니다.' });
  }
};

// 1:1 채팅방 생성/조회
exports.getOrCreateDirectMessage = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user?.id;

    console.log(`💬 1:1 채팅방 요청: ${userId} <-> ${targetUserId}`);

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    if (userId == targetUserId) {
      return res.status(400).json({ error: '자기 자신과는 채팅할 수 없습니다.' });
    }

    const directMessage = await chatRoomModel.getOrCreateDirectMessageAsync(userId, parseInt(targetUserId));
    console.log(`✅ 1:1 채팅방 준비 완료: 방 ${directMessage.room_id}`);
    res.json(directMessage);
  } catch (error) {
    console.error('❌ 1:1 채팅방 생성/조회 오류:', error);
    res.status(500).json({ error: '1:1 채팅방을 생성하는데 실패했습니다.' });
  }
};