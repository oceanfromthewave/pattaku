const chatMessageModel = require("../models/chatMessageModel");

// 채팅방 메시지 조회
exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const messages = await chatMessageModel.getRoomMessagesAsync(
      roomId,
      parseInt(limit),
      parseInt(offset)
    );

    // 읽음 상태 업데이트
    await chatMessageModel.updateLastReadAsync(roomId, userId);

    res.json(messages);
  } catch (error) {
    console.error("메시지 조회 오류:", error);
    res.status(500).json({ error: "메시지를 불러오는데 실패했습니다." });
  }
};

// 메시지 전송 (REST API용 - Socket.io에서 주로 사용)
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message, message_type = "text", reply_to = null } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "메시지 내용을 입력해주세요." });
    }

    const newMessage = await chatMessageModel.createMessageAsync({
      room_id: roomId,
      user_id: userId,
      message: message.trim(),
      message_type,
      reply_to,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("메시지 전송 오류:", error);
    res.status(500).json({ error: "메시지 전송에 실패했습니다." });
  }
};

// 메시지 수정
exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    if (!message || message.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "수정할 메시지 내용을 입력해주세요." });
    }

    await chatMessageModel.updateMessageAsync(
      messageId,
      userId,
      message.trim()
    );

    res.json({ message: "메시지가 수정되었습니다." });
  } catch (error) {
    console.error("메시지 수정 오류:", error);
    res.status(500).json({ error: "메시지 수정에 실패했습니다." });
  }
};

// 메시지 삭제
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    await chatMessageModel.deleteMessageAsync(messageId, userId);

    res.json({ message: "메시지가 삭제되었습니다." });
  } catch (error) {
    console.error("메시지 삭제 오류:", error);
    res.status(500).json({ error: "메시지 삭제에 실패했습니다." });
  }
};

// 안읽은 메시지 수 조회
exports.getUnreadCount = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const unreadCount = await chatMessageModel.getUnreadCountAsync(
      roomId,
      userId
    );
    res.json({ unreadCount });
  } catch (error) {
    console.error("안읽은 메시지 수 조회 오류:", error);
    res.status(500).json({ error: "안읽은 메시지 수 조회에 실패했습니다." });
  }
};

// 전체 안읽은 메시지 수 조회
exports.getTotalUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const totalUnread = await chatMessageModel.getTotalUnreadCountAsync(userId);
    res.json({ totalUnread });
  } catch (error) {
    console.error("전체 안읽은 메시지 수 조회 오류:", error);
    res
      .status(500)
      .json({ error: "전체 안읽은 메시지 수 조회에 실패했습니다." });
  }
};
