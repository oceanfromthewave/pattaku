import { useState, useEffect } from 'react';
import { notifySuccess, notifyError } from '../../utils/notify';
import { 
  getMyProfile, 
  getMyStats, 
  updateProfile, 
  changePassword,
  getApiErrorMessage 
} from '../../api/userApi';
import MyPostList from './MyPostList';
import MyCommentList from './MyCommentList';
import styles from '../../styles/MyPage.module.scss';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // 프로필 수정 폼 상태
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    email: ''
  });
  
  // 비밀번호 변경 폼 상태
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [profileData, statsData] = await Promise.all([
        getMyProfile(),
        getMyStats()
      ]);
      
      setProfile(profileData);
      setStats(statsData);
      setProfileForm({
        nickname: profileData.nickname || '',
        email: profileData.email || ''
      });
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      notifyError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // 프로필 수정
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileForm.nickname.trim()) {
      notifyError('닉네임을 입력해주세요.');
      return;
    }

    try {
      setUpdating(true);
      await updateProfile(profileForm);
      notifySuccess('프로필이 업데이트되었습니다.');
      
      // 프로필 다시 로드
      const updatedProfile = await getMyProfile();
      setProfile(updatedProfile);
      
      // localStorage의 nickname도 업데이트
      localStorage.setItem('nickname', updatedProfile.nickname);
      
    } catch (error) {
      console.error('프로필 수정 오류:', error);
      notifyError(getApiErrorMessage(error));
    } finally {
      setUpdating(false);
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      notifyError('모든 필드를 입력해주세요.');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notifyError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      notifyError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    try {
      setUpdating(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      notifySuccess('비밀번호가 변경되었습니다.');
      
      // 폼 초기화
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      notifyError(getApiErrorMessage(error));
    } finally {
      setUpdating(false);
    }
  };

  // 탭 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className={styles.profileTab}>
            <div className={styles.statsCard}>
              <h3>📊 활동 통계</h3>
              {stats && (
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.postCount}</span>
                    <span className={styles.statLabel}>작성한 글</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.commentCount}</span>
                    <span className={styles.statLabel}>작성한 댓글</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.totalLikes}</span>
                    <span className={styles.statLabel}>받은 좋아요</span>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.profileCard}>
              <h3>👤 프로필 정보</h3>
              <form onSubmit={handleProfileUpdate}>
                <div className={styles.formGroup}>
                  <label>아이디</label>
                  <input 
                    type="text" 
                    value={profile?.username || ''} 
                    disabled 
                    className={styles.disabledInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>닉네임 *</label>
                  <input 
                    type="text" 
                    value={profileForm.nickname}
                    onChange={(e) => setProfileForm({...profileForm, nickname: e.target.value})}
                    disabled={updating}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>이메일</label>
                  <input 
                    type="email" 
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    disabled={updating}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>가입일</label>
                  <input 
                    type="text" 
                    value={profile ? new Date(profile.created_at).toLocaleDateString() : ''} 
                    disabled 
                    className={styles.disabledInput}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={styles.updateBtn}
                  disabled={updating}
                >
                  {updating ? '업데이트 중...' : '프로필 업데이트'}
                </button>
              </form>
            </div>

            <div className={styles.passwordCard}>
              <h3>🔒 비밀번호 변경</h3>
              {!showPasswordForm ? (
                <button 
                  className={styles.showPasswordBtn}
                  onClick={() => setShowPasswordForm(true)}
                >
                  비밀번호 변경하기
                </button>
              ) : (
                <form onSubmit={handlePasswordChange}>
                  <div className={styles.formGroup}>
                    <label>현재 비밀번호 *</label>
                    <input 
                      type="password" 
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      disabled={updating}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>새 비밀번호 *</label>
                    <input 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      disabled={updating}
                      minLength={6}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>새 비밀번호 확인 *</label>
                    <input 
                      type="password" 
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      disabled={updating}
                      required
                    />
                  </div>
                  
                  <div className={styles.buttonGroup}>
                    <button 
                      type="submit" 
                      className={styles.updateBtn}
                      disabled={updating}
                    >
                      {updating ? '변경 중...' : '비밀번호 변경'}
                    </button>
                    <button 
                      type="button" 
                      className={styles.cancelBtn}
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      disabled={updating}
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      
      case 'posts':
        return <MyPostList />;
      
      case 'comments':
        return <MyCommentList />;
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>마이페이지를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={styles.myPageContainer}>
      <div className={styles.header}>
        <h1>👤 마이페이지</h1>
        <p>안녕하세요, <strong>{profile?.nickname}</strong>님!</p>
      </div>

      <div className={styles.tabNav}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.active : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          프로필 관리
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.active : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          내가 쓴 글
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'comments' ? styles.active : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          내가 쓴 댓글
        </button>
      </div>

      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>
    </div>
  );
}
