import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChatSocket } from '../../contexts/ChatContext';
import { chatRoomApi } from '../../api/chatApi';
import { notifyError, notifySuccess } from '../../utils/notify';
import styles from '../../styles/ChatRoomList.module.scss';

export default function ChatRoomList() {
  const { isLoggedIn } = useAuth();
  const { getTotalUnreadCount } = useChatSocket();
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
      let roomsData;
      
      if (activeTab === 'all') {
        roomsData = await chatRoomApi.getAllRooms();
      } else {
        roomsData = await chatRoomApi.getRoomsByType(activeTab);
      }
      
      setRooms(roomsData);
    } catch (error) {
      console.error('채팅방 목록 조회 오류:', error);
      notifyError('채팅방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRooms = async () => {
    try {
      const myRoomsData = await chatRoomApi.getUserRooms();
      setMyRooms(myRoomsData);
    } catch (error) {
      console.error('내 채팅방 조회 오류:', error);
    }
  };

  const handleRoomClick = (roomId) => {
    if (!isLoggedIn) {
      notifyError('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }
    navigate(`/chat/${roomId}`);
  };

  const handleJoinRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      notifyError('로그인 후 이용해주세요.');
      return;
    }

    try {
      await chatRoomApi.joinRoom(roomId);
      notifySuccess('채팅방에 참여했습니다.');
      fetchMyRooms();
    } catch (error) {
      console.error('채팅방 참여 오류:', error);
      notifyError('채팅방 참여에 실패했습니다.');
    }
  };

  const getRoomTypeIcon = (type, topic) => {
    switch (type) {
      case 'public': return '🌍';
      case 'topic':
        switch (topic) {
          case 'free': return '💬';
          case 'qna': return '❓';
          case 'notice': return '📢';
          default: return '📝';
        }
      case 'private': return '🔒';
      default: return '💬';
    }
  };

  const isRoomJoined = (roomId) => {
    return myRooms.some(room => room.id === roomId);
  };

  if (loading) {
    return (
      <div className={styles.chatRoomListRoot}>
        <div className={styles.loading}>채팅방 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.chatRoomListRoot}>
      {/* 페이지 헤더 */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>💬 채팅방</h1>
        <p className={styles.pageSubtitle}>실시간으로 소통해보세요!</p>
        {getTotalUnreadCount() > 0 && (
          <div className={styles.unreadBadge}>
            {getTotalUnreadCount()}개의 새 메시지
          </div>
        )}
      </div>

      {/* 탭 메뉴 */}
      <div className={styles.tabMenu}>
        <button
          className={`${styles.tabButton} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveTab('all')}
        >
          전체
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'public' ? styles.active : ''}`}
          onClick={() => setActiveTab('public')}
        >
          공개방
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'topic' ? styles.active : ''}`}
          onClick={() => setActiveTab('topic')}
        >
          주제방
        </button>
        {isLoggedIn && (
          <button
            className={`${styles.tabButton} ${activeTab === 'my' ? styles.active : ''}`}
            onClick={() => setActiveTab('my')}
          >
            내 채팅방
          </button>
        )}
      </div>

      {/* 채팅방 목록 */}
      <div className={styles.roomList}>
        {activeTab === 'my' ? (
          myRooms.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <h3>참여중인 채팅방이 없습니다</h3>
              <p>다른 탭의 채팅방에 참여해보세요!</p>
            </div>
          ) : (
            myRooms.map((room) => (
              <div
                key={room.id}
                className={styles.roomCard}
                onClick={() => handleRoomClick(room.id)}
              >
                <div className={styles.roomIcon}>
                  {getRoomTypeIcon(room.type, room.topic)}
                </div>
                <div className={styles.roomInfo}>
                  <h3 className={styles.roomName}>{room.name}</h3>
                  <p className={styles.roomDescription}>{room.description}</p>
                  <div className={styles.roomMeta}>
                    <span>참여자 {room.participant_count || 0}명</span>
                    {room.unread_count > 0 && (
                      <span className={styles.unreadCount}>
                        {room.unread_count}개 새 메시지
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          rooms.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏠</div>
              <h3>채팅방이 없습니다</h3>
              <p>{activeTab === 'all' ? '아직 생성된 채팅방이 없습니다.' : `${activeTab} 타입의 채팅방이 없습니다.`}</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className={styles.roomCard}
                onClick={() => handleRoomClick(room.id)}
              >
                <div className={styles.roomIcon}>
                  {getRoomTypeIcon(room.type, room.topic)}
                </div>
                <div className={styles.roomInfo}>
                  <h3 className={styles.roomName}>{room.name}</h3>
                  <p className={styles.roomDescription}>{room.description}</p>
                  <div className={styles.roomMeta}>
                    <span>참여자 {room.participant_count || 0}명</span>
                    <span>메시지 {room.message_count || 0}개</span>
                    {room.creator_nickname && (
                      <span>생성자 {room.creator_nickname}</span>
                    )}
                  </div>
                </div>
                {isLoggedIn && !isRoomJoined(room.id) && (
                  <button
                    className={styles.joinButton}
                    onClick={(e) => handleJoinRoom(room.id, e)}
                  >
                    참여하기
                  </button>
                )}
                {isRoomJoined(room.id) && (
                  <div className={styles.joinedBadge}>참여중</div>
                )}
              </div>
            ))
          )
        )}
      </div>

      {/* 새 채팅방 생성 버튼 */}
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
          onSuccess={fetchRooms}
        />
      )}
    </div>
  );
}

// 채팅방 생성 모달 컴포넌트
function CreateRoomModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'topic',
    topic: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notifyError('채팅방 이름을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await chatRoomApi.createRoom(formData);
      notifySuccess('채팅방이 생성되었습니다.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      notifyError('채팅방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>새 채팅방 만들기</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>채팅방 이름</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="채팅방 이름을 입력하세요"
              maxLength={50}
            />
          </div>

          <div className={styles.formGroup}>
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="채팅방 설명을 입력하세요"
              maxLength={200}
            />
          </div>

          <div className={styles.formGroup}>
            <label>타입</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="public">공개방</option>
              <option value="topic">주제방</option>
            </select>
          </div>

          {formData.type === 'topic' && (
            <div className={styles.formGroup}>
              <label>주제</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                placeholder="주제를 입력하세요"
                maxLength={30}
              />
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={loading}>
              취소
            </button>
            <button type="submit" disabled={loading}>
              {loading ? '생성 중...' : '생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}