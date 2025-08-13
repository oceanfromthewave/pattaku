import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChatSocket } from '../../contexts/ChatContext';
import { chatApi } from '../../api/chatApi';
import { notifyError, notifySuccess } from '../../utils/notify';
import styles from '../../styles/ChatRoomList.module.scss';

export default function ChatRoomList() {
  const { isLoggedIn } = useAuth();
  const { getTotalUnreadCount, isConnected, isAuthenticated } = useChatSocket();
  const [rooms, setRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    if (isLoggedIn) {
      fetchMyRooms();
    }
  }, [isLoggedIn, activeTab]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      console.log('📋 채팅방 목록 요청 시작...');
      
      let roomsData;
      
      if (activeTab === 'all') {
        roomsData = await chatApi.rooms.getAll();
      } else if (activeTab === 'my') {
        roomsData = await chatApi.rooms.getMy();
      } else {
        roomsData = await chatApi.rooms.getByType(activeTab);
      }
      
      console.log(`✅ 채팅방 ${roomsData.length}개 로드됨:`, roomsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('❌ 채팅방 목록 조회 오류:', error);
      notifyError('채팅방 목록을 불러오는데 실패했습니다.');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRooms = async () => {
    try {
      console.log('📋 내 채팅방 목록 요청...');
      const myRoomsData = await chatApi.rooms.getMy();
      console.log(`✅ 내 채팅방 ${myRoomsData.length}개 로드됨:`, myRoomsData);
      setMyRooms(myRoomsData);
    } catch (error) {
      console.error('❌ 내 채팅방 조회 오류:', error);
      setMyRooms([]);
    }
  };

  const handleRoomClick = (roomId) => {
    if (!isLoggedIn) {
      notifyError('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }
    console.log('🚪 채팅방 입장:', roomId);
    navigate(`/chat/${roomId}`);
  };

  const handleJoinRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      notifyError('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }

    try {
      console.log('🚪 채팅방 참여 시도:', roomId);
      await chatApi.rooms.join(roomId);
      notifySuccess('채팅방에 참여했습니다.');
      fetchMyRooms(); // 내 채팅방 목록 새로고침
    } catch (error) {
      console.error('❌ 채팅방 참여 오류:', error);
      notifyError('채팅방 참여에 실패했습니다.');
    }
  };

  const handleCreateRoom = async (formData) => {
    try {
      console.log('🏗️ 채팅방 생성 시도:', formData);
      const response = await chatApi.rooms.create(formData);
      notifySuccess('채팅방이 생성되었습니다.');
      setShowCreateModal(false);
      fetchRooms(); // 목록 새로고침
      
      // 생성된 채팅방으로 이동
      if (response.roomId) {
        navigate(`/chat/${response.roomId}`);
      }
    } catch (error) {
      console.error('❌ 채팅방 생성 오류:', error);
      notifyError('채팅방 생성에 실패했습니다.');
    }
  };

  const isRoomJoined = (roomId) => {
    return myRooms.some(room => room.id === roomId);
  };

  const getRoomIcon = (type) => {
    switch (type) {
      case 'public': return '🌍';
      case 'topic': return '📝';
      case 'private': return '🔒';
      default: return '💬';
    }
  };

  const getTabRooms = () => {
    if (activeTab === 'my') {
      return myRooms;
    }
    return rooms;
  };

  if (loading) {
    return (
      <div className={styles.chatRoomListRoot}>
        <div className={styles.loading}>
          채팅방 목록을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatRoomListRoot}>
      {/* 디버그 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          background: '#f0f0f0', 
          padding: '10px', 
          margin: '10px 0', 
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          <strong>🔧 디버그 정보:</strong><br/>
          소켓 연결: {isConnected ? '✅' : '❌'} | 
          인증 상태: {isAuthenticated ? '✅' : '❌'} | 
          로그인: {isLoggedIn ? '✅' : '❌'} | 
          안읽은 메시지: {getTotalUnreadCount()}개
        </div>
      )}

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>💬 채팅방</h1>
        <p className={styles.pageSubtitle}>
          실시간으로 다른 사용자들과 소통해보세요
          {getTotalUnreadCount() > 0 && (
            <span className={styles.unreadBadge}>
              {getTotalUnreadCount()}개의 새 메시지
            </span>
          )}
        </p>
      </div>

      <div className={styles.tabMenu}>
        <button
          className={`${styles.tabButton} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveTab('all')}
        >
          🌍 전체
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'public' ? styles.active : ''}`}
          onClick={() => setActiveTab('public')}
        >
          📢 공개방
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'topic' ? styles.active : ''}`}
          onClick={() => setActiveTab('topic')}
        >
          📝 주제방
        </button>
        {isLoggedIn && (
          <button
            className={`${styles.tabButton} ${activeTab === 'my' ? styles.active : ''}`}
            onClick={() => setActiveTab('my')}
          >
            💼 내 채팅방
          </button>
        )}
      </div>

      <div className={styles.roomList}>
        {getTabRooms().length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>채팅방이 없습니다</h3>
            <p>
              {activeTab === 'my' 
                ? '아직 참여한 채팅방이 없습니다. 다른 채팅방에 참여해보세요!'
                : '아직 생성된 채팅방이 없습니다.'
              }
            </p>
          </div>
        ) : (
          getTabRooms().map((room) => (
            <div
              key={room.id}
              className={styles.roomCard}
              onClick={() => handleRoomClick(room.id)}
            >
              <div className={styles.roomIcon}>
                {getRoomIcon(room.type)}
              </div>
              
              <div className={styles.roomInfo}>
                <h3 className={styles.roomName}>{room.name}</h3>
                <p className={styles.roomDescription}>
                  {room.description || '설명이 없습니다.'}
                </p>
                <div className={styles.roomMeta}>
                  <span>👥 {room.participant_count || 0}명</span>
                  {room.topic && <span>🏷️ {room.topic}</span>}
                  {room.unread_count > 0 && (
                    <span className={styles.unreadCount}>
                      {room.unread_count}개 안읽음
                    </span>
                  )}
                </div>
              </div>

              {isLoggedIn && !isRoomJoined(room.id) ? (
                <button
                  className={styles.joinButton}
                  onClick={(e) => handleJoinRoom(room.id, e)}
                >
                  참여하기
                </button>
              ) : isRoomJoined(room.id) ? (
                <div className={styles.joinedBadge}>
                  참여중
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {isLoggedIn && (
        <div className={styles.actionButtons}>
          <button
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            ➕ 새 채팅방 만들기
          </button>
        </div>
      )}

      {/* 채팅방 생성 모달 */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRoom}
        />
      )}
    </div>
  );
}

// 채팅방 생성 모달 컴포넌트
function CreateRoomModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public',
    topic: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notifyError('채팅방 이름을 입력해주세요.');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>새 채팅방 만들기</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>채팅방 이름 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="채팅방 이름을 입력하세요"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="채팅방에 대한 간단한 설명을 입력하세요"
            />
          </div>

          <div className={styles.formGroup}>
            <label>채팅방 타입</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="public">🌍 공개방 - 모든 사용자 참여 가능</option>
              <option value="topic">📝 주제방 - 특정 주제로 분류</option>
            </select>
          </div>

          {formData.type === 'topic' && (
            <div className={styles.formGroup}>
              <label>주제</label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="예: 자유주제, 질문답변, 취미생활 등"
              />
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>취소</button>
            <button type="submit">생성하기</button>
          </div>
        </form>
      </div>
    </div>
  );
}