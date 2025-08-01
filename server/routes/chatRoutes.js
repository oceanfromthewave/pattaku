const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const chatMessageController = require('../controllers/chatMessageController');
const auth = require('../middleware/authMiddleware');

// 채팅방 관련 라우트
router.get('/rooms', chatController.getAllRooms);
router.get('/rooms/type/:type', chatController.getRoomsByType);
router.get('/rooms/my', auth, chatController.getUserRooms);
router.get('/rooms/:roomId', auth, chatController.getRoomById);
router.post('/rooms', auth, chatController.createRoom);
router.post('/rooms/:roomId/join', auth, chatController.joinRoom);
router.delete('/rooms/:roomId/leave', auth, chatController.leaveRoom);

// 1:1 채팅 라우트
router.get('/direct/:targetUserId', auth, chatController.getOrCreateDirectMessage);

// 메시지 관련 라우트
router.get('/rooms/:roomId/messages', auth, chatMessageController.getRoomMessages);
router.post('/rooms/:roomId/messages', auth, chatMessageController.sendMessage);
router.put('/messages/:messageId', auth, chatMessageController.updateMessage);
router.delete('/messages/:messageId', auth, chatMessageController.deleteMessage);
router.get('/rooms/:roomId/unread', auth, chatMessageController.getUnreadCount);
router.get('/unread-total', auth, chatMessageController.getTotalUnreadCount);

module.exports = router;