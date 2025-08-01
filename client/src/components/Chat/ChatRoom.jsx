import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChatSocket } from '../../contexts/ChatContext';
import { chatRoomApi, chatMessageApi } from '../../api/chatApi';
import { getProfileImageUrl } from '../../utils/imageUtils';
import { notifyError } from '../../utils/notify';
import styles from '../../styles/ChatRoom.module.scss';

export default function ChatRoom() {
  const { roomId } = useParams();
  const { userInfo } = useAuth();
  const {
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTyping,
    markAsRead,
    getRoomMessages,
    getRoomTypingUsers,
    setMessages
  } = useChatSocket();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // 채팅방 정보 로드
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const roomData = await chatRoomApi.getRoomById(roomId);
        setRoom(roomData);
        
        // 메시지 로드
        const messages = await chatMessageApi.getRoomMessages(roomId);
        setMessages(prev => ({ ...prev, [roomId]: messages }));
        
        // 채팅방 참여
        if (isConnected) {
          joinRoom(parseInt(roomId));
        }
      } catch (error) {
        console.error('채팅방 로드 오류:', error);
        notifyError('채팅방을 불러오는데 실패했습니다.');
        navigate('/chat');
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }

    return () => {
      if (roomId && isConnected) {
        leaveRoom(parseInt(roomId));
      }
    };
  }, [roomId, isConnected]);

  // 메시지 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [getRoomMessages(parseInt(roomId))]);

  // 읽음 상태 업데이트
  useEffect(() => {
    if (roomId && isConnected) {
      markAsRead(parseInt(roomId));
    }
  }, [roomId, isConnected, getRoomMessages(parseInt(roomId))]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    if (editingMessage) {
      // 메시지 수정
      editMessage(editingMessage.id, messageInput.trim());
      setEditingMessage(null);
    } else {
      // 새 메시지 전송
      sendMessage(
        parseInt(roomId),
        messageInput.trim(),
        'text',
        replyTo?.id || null
      );
    }

    setMessageInput('');
    setReplyTo(null);
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    
    // 타이핑 상태 전송
    sendTyping(parseInt(roomId), true);
    
    // 타이핑 중지 타이머
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(parseInt(roomId), false);
    }, 1000);
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setMessageInput(message.message);
    messageInputRef.current?.focus();
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('메시지를 삭제하시겠습니까?')) {
      deleteMessage(messageId);
    }
  };

  const handleReplyMessage = (message) => {
    setReplyTo(message);
    messageInputRef.current?.focus();
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const messages = getRoomMessages(parseInt(roomId)) || [];
  const typingUsers = getRoomTypingUsers(parseInt(roomId)) || [];

  if (loading) {
    return (
      <div className={styles.chatRoomRoot}>
        <div className={styles.loading}>채팅방을 불러오는 중...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={styles.chatRoomRoot}>
        <div className={styles.error}>채팅방을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.chatRoomRoot}>
      {/* 채팅방 헤더 */}
      <div className={styles.chatHeader}>
        <button className={styles.backButton} onClick={() => navigate('/chat')}>
          ← 뒤로
        </button>
        <div className={styles.roomInfo}>
          <h2 className={styles.roomName}>{room.name}</h2>
          <span className={styles.participantCount}>
            {room.participant_count}명 참여중
          </span>
        </div>
        <button
          className={styles.participantsButton}
          onClick={() => setShowParticipants(!showParticipants)}
        >
          👥
        </button>
      </div>

      <div className={styles.chatBody}>
        {/* 메시지 영역 */}
        <div className={styles.messagesContainer}>
          <div className={styles.messagesList}>
            {messages.length === 0 ? (
              <div className={styles.emptyMessages}>
                <div className={styles.emptyIcon}>💬</div>
                <p>아직 메시지가 없습니다. 첫 메시지를 보내보세요!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`${styles.messageItem} ${
                    message.user_id === userInfo?.id ? styles.myMessage : styles.otherMessage
                  }`}
                >
                  {message.user_id !== userInfo?.id && (
                    <div className={styles.messageAvatar}>
                      {message.sender_profile ? (
                        <img
                          src={getProfileImageUrl(message.sender_profile)}
                          alt={message.sender_nickname}
                          className={styles.avatarImage}
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {message.sender_nickname?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={styles.messageContent}>
                    {message.user_id !== userInfo?.id && (
                      <div className={styles.messageSender}>
                        {message.sender_nickname}
                      </div>
                    )}
                    
                    {/* 답글 표시 */}
                    {message.reply_to && (
                      <div className={styles.replyPreview}>
                        <span className={styles.replyIcon}>↳</span>
                        <span className={styles.replyContent}>
                          {message.reply_message || '삭제된 메시지'}
                        </span>
                      </div>
                    )}
                    
                    <div className={styles.messageBubble}>
                      <div className={styles.messageText}>
                        {message.message}
                      </div>
                      <div className={styles.messageTime}>
                        {formatMessageTime(message.created_at)}
                        {message.updated_at !== message.created_at && (
                          <span className={styles.editedTag}>(수정됨)</span>
                        )}
                      </div>
                    </div>
                    
                    {/* 메시지 액션 버튼 */}
                    <div className={styles.messageActions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleReplyMessage(message)}
                        title="답글"
                      >
                        ↩️
                      </button>
                      {message.user_id === userInfo?.id && (
                        <>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleEditMessage(message)}
                            title="수정"
                          >
                            ✏️
                          </button>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleDeleteMessage(message.id)}
                            title="삭제"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* 타이핑 표시 */}
            {typingUsers.length > 0 && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingUsers}>
                  {typingUsers.map(user => user.nickname).join(', ')}님이 입력 중
                </div>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 참여자 목록 (사이드바) */}
        {showParticipants && (
          <div className={styles.participantsSidebar}>
            <div className={styles.participantsHeader}>
              <h3>참여자 ({room.participants?.length || 0})</h3>
              <button onClick={() => setShowParticipants(false)}>✕</button>
            </div>
            <div className={styles.participantsList}>
              {room.participants?.map((participant) => (
                <div key={participant.user_id} className={styles.participantItem}>
                  <div className={styles.participantAvatar}>
                    {participant.profileImage ? (
                      <img
                        src={getProfileImageUrl(participant.profileImage)}
                        alt={participant.nickname}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {participant.nickname?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <span className={styles.participantName}>
                    {participant.nickname}
                  </span>
                  {participant.is_admin && (
                    <span className={styles.adminBadge}>관리자</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 메시지 입력 영역 */}
      <div className={styles.messageInputContainer}>
        {/* 답글/수정 모드 표시 */}
        {(replyTo || editingMessage) && (
          <div className={styles.inputModeIndicator}>
            {replyTo && (
              <div className={styles.replyMode}>
                <span className={styles.modeIcon}>↩️</span>
                <span className={styles.modeText}>
                  {replyTo.sender_nickname}님에게 답글: {replyTo.message}
                </span>
                <button
                  className={styles.cancelMode}
                  onClick={() => setReplyTo(null)}
                >
                  ✕
                </button>
              </div>
            )}
            {editingMessage && (
              <div className={styles.editMode}>
                <span className={styles.modeIcon}>✏️</span>
                <span className={styles.modeText}>메시지 수정 중</span>
                <button
                  className={styles.cancelMode}
                  onClick={() => {
                    setEditingMessage(null);
                    setMessageInput('');
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className={styles.messageInputForm}>
          <input
            ref={messageInputRef}
            type="text"
            value={messageInput}
            onChange={handleTyping}
            placeholder="메시지를 입력하세요..."
            className={styles.messageInput}
            disabled={!isConnected}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!messageInput.trim() || !isConnected}
          >
            {editingMessage ? '수정' : '전송'}
          </button>
        </form>
      </div>
    </div>
  );
}