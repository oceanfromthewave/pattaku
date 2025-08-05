// components/Chat/EnhancedChatRoomList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChatSocket } from '../../contexts/ChatContext';
import styles from '../../styles/EnhancedChatRoomList.module.scss';

const chatRoomApi = {
  getAllRooms: async () => {
    const response = await fetch('/api/chat/rooms', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    return data.rooms;
  },
  
  getMyRooms: async () => {
    const response = await fetch('/api/chat/my-rooms', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    return data.rooms;
  },
  
  createRoom: async (roomData) => {
    const response = await fetch('/api/chat/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(roomData)
    });
    const data = await response.json();
    return data.room;
  },
  
  joinRoom: async (roomId) => {
    const response = await fetch(`/api/chat/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return await response.json();
  }
};

export default function EnhancedChatRoomList() {
  const { userInfo } = useAuth();
  const { isConnected } = useChatSocket();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    type: 'topic',
    topic: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'my') {
        const myRoomsData = await chatRoomApi.getMyRooms();
        setMyRooms(myRoomsData);
      } else {
        const roomsData = await chatRoomApi.getAllRooms();
        setRooms(roomsData);
      }
    } catch (error) {
      console.error('채팅방 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (!newRoom.name.trim()) {
      alert('채팅방 이름을 입력해주세요.');
      return;
    }

    try {
      await chatRoomApi.createRoom(newRoom);
      alert('채팅방이 생성되었습니다.');
      setShowCreateModal(false);
      setNewRoom({ name: '', description: '', type: 'topic', topic: '' });
      loadData();
    } catch (error) {
      console.error('채팅방 생성 실패:', error);
      alert('채팅방 생성에 실패했습니다.');
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await chatRoomApi.joinRoom(roomId);
      alert('채팅방에 참여했습니다.');
      navigate(`/chat/${roomId}`);
    } catch (error) {
      console.error('채팅방 참여 실패:', error);
      alert('채팅방 참여에 실패했습니다.');
    }
  };

  const getFilteredRooms = () => {
    const targetRooms = activeTab === 'my' ? myRooms : rooms;
    
    if (!searchQuery.trim()) return targetRooms;
    
    const query = searchQuery.toLowerCase();
    return targetRooms.filter(room => 
      room.name.toLowerCase().includes(query) ||
      room.description?.toLowerCase().includes(query) ||
      room.topic?.toLowerCase().includes(query)
    );
  };

  const filteredRooms = getFilteredRooms();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>채팅방 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={styles.chatRoomListRoot}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>💬 채팅방 목록</h1>
          <div className={styles.headerActions}>
            <div className={styles.connectionStatus}>
              <span className={`${styles.statusDot} ${isConnected ? styles.online : styles.offline}`} />
              {isConnected ? '온라인' : '오프라인'}
            </div>
            <button
              className={styles.createButton}
              onClick={() => setShowCreateModal(true)}
            >
              ➕ 채팅방 만들기
            </button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className={styles.tabMenu}>
          <button
            className={`${styles.tabButton} ${activeTab === 'my' ? styles.active : ''}`}
            onClick={() => setActiveTab('my')}
          >
            📁 내 채팅방
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'public' ? styles.active : ''}`}
            onClick={() => setActiveTab('public')}
          >
            🌐 전체 채팅방
          </button>
        </div>

        {/* 검색 */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="채팅방 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* 채팅방 목록 */}
      <div className={styles.roomList}>
        {filteredRooms.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>
              {activeTab === 'my' 
                ? '참여 중인 채팅방이 없습니다' 
                : '검색 결과가 없습니다'
              }
            </h3>
            <p>
              {activeTab === 'my' 
                ? '새로운 채팅방을 만들거나 기존 채팅방에 참여해보세요!' 
                : '다른 검색어를 시도해보세요.'
              }
            </p>
            {activeTab === 'my' && (
              <button
                className={styles.primaryButton}
                onClick={() => setShowCreateModal(true)}
              >
                첫 채팅방 만들기
              </button>
            )}
          </div>
        ) : (
          <div className={styles.roomGrid}>
            {filteredRooms.map((room) => (
              <div key={room.id} className={styles.roomCard}>
                <div className={styles.roomHeader}>
                  <div className={styles.roomIcon}>
                    {room.type === 'public' ? '🌐' : room.type === 'topic' ? '💭' : '🔒'}
                  </div>
                  <div className={styles.roomInfo}>
                    <h3 className={styles.roomName}>{room.name}</h3>
                    {room.topic && (
                      <span className={styles.roomTopic}>#{room.topic}</span>
                    )}
                  </div>
                </div>

                {room.description && (
                  <p className={styles.roomDescription}>{room.description}</p>
                )}

                <div className={styles.roomMeta}>
                  <div className={styles.roomStats}>
                    <span className={styles.stat}>
                      👥 {room.participant_count}명
                    </span>
                  </div>
                  
                  {room.creator_nickname && (
                    <span className={styles.creator}>
                      by {room.creator_nickname}
                    </span>
                  )}
                </div>

                <div className={styles.roomActions}>
                  {activeTab === 'my' ? (
                    <Link 
                      to={`/chat/${room.id}`}
                      className={styles.enterButton}
                    >
                      입장하기
                    </Link>
                  ) : (
                    <button
                      className={styles.joinButton}
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      참여하기
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 채팅방 생성 모달 */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>새 채팅방 만들기</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className={styles.createForm}>
              <div className={styles.formGroup}>
                <label htmlFor="roomName">채팅방 이름 *</label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="채팅방 이름을 입력하세요"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="roomDescription">설명</label>
                <textarea
                  id="roomDescription"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="채팅방에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="roomType">채팅방 유형</label>
                <select
                  id="roomType"
                  value={newRoom.type}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="topic">주제별 채팅방</option>
                  <option value="public">전체 채팅방</option>
                </select>
              </div>

              {newRoom.type === 'topic' && (
                <div className={styles.formGroup}>
                  <label htmlFor="roomTopic">주제 태그</label>
                  <input
                    id="roomTopic"
                    type="text"
                    value={newRoom.topic}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="예: 개발, 취미, 스터디 등"
                  />
                </div>
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowCreateModal(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                >
                  채팅방 만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
