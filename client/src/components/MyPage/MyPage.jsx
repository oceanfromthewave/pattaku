import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notifySuccess, notifyError } from '../../utils/notify';
import { 
  getMyProfile, 
  getMyStats, 
  updateProfile, 
  changePassword,
  uploadProfileImage,
  deleteProfileImage,
  getApiErrorMessage 
} from '../../api/userApi';
import { getProfileImageUrl } from '../../utils/imageUtils';
import MyPostList from './MyPostList';
import MyCommentList from './MyCommentList';
import styles from '../../styles/MyPage.module.scss';

export default function MyPage() {
  const { updateUserInfo, userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  
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

  // 프로필 사진 업로드 핸들러
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 타입 및 크기 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      notifyError('지원되는 이미지 형식: JPG, PNG, GIF');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      notifyError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      setUploadingImage(true);
      
      
      const response = await uploadProfileImage(file);
      
      
      notifySuccess('프로필 사진이 업로드되었습니다.');
      
      // 프로필 다시 로드
      const updatedProfile = await getMyProfile();
      
      
      setProfile(updatedProfile);
      
      // AuthContext의 사용자 정보도 업데이트
      updateUserInfo({ profileImage: updatedProfile.profile_image });
      
      
    } catch (error) {
      
      notifyError(getApiErrorMessage(error));
    } finally {
      setUploadingImage(false);
      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 프로필 사진 삭제 핸들러
  const handleImageDelete = async () => {
    if (!window.confirm('프로필 사진을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setUploadingImage(true);
      
      
      await deleteProfileImage();
      notifySuccess('프로필 사진이 삭제되었습니다.');
      
      // 프로필 다시 로드
      const updatedProfile = await getMyProfile();
      
      
      setProfile(updatedProfile);
      
      // AuthContext의 사용자 정보도 업데이트
      updateUserInfo({ profileImage: null });
      
      
    } catch (error) {
      
      notifyError(getApiErrorMessage(error));
    } finally {
      setUploadingImage(false);
    }
  };

  // 탭 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className={styles.profileTab}>
            {/* 프로필 사진 섹션 */}
            <div className={styles.profileImageCard}>
              <h3>📷 프로필 사진</h3>
              <div className={styles.profileImageSection}>
                <div className={styles.profileImageContainer}>
                  {profile?.profile_image ? (
                    <>
                      <img 
                        src={getProfileImageUrl(profile.profile_image)} 
                        alt="프로필 사진" 
                        className={styles.profileImage}
                        onLoad={() => {
                          
                        }}
                        onError={(e) => {
                          console.error('❌ 이미지 로드 실패:', {
                            원본경로: profile.profile_image,
                            변환된URL: getProfileImageUrl(profile.profile_image),
                            에러: e
                          });
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className={styles.profileImagePlaceholder} style={{display: 'none'}}>
                        <span className={styles.placeholderIcon}>👤</span>
                        <p>이미지를 불러올 수 없습니다</p>
                        <small>{getProfileImageUrl(profile.profile_image)}</small>
                      </div>
                    </>
                  ) : (
                    <div className={styles.profileImagePlaceholder}>
                      <span className={styles.placeholderIcon}>👤</span>
                      <p>프로필 사진을 업로드해보세요</p>
                    </div>
                  )}
                </div>
                
                <div className={styles.profileImageActions}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={styles.hiddenFileInput}
                  />
                  
                  <button
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? '업로드 중...' : '📷 사진 업로드'}
                  </button>
                  
                  {profile?.profile_image && (
                    <button
                      className={styles.deleteBtn}
                      onClick={handleImageDelete}
                      disabled={uploadingImage}
                    >
                      🗑️ 사진 삭제
                    </button>
                  )}
                </div>
                
                <div className={styles.imageUploadHint}>
                  <p>• 지원 형식: JPG, PNG, GIF</p>
                  <p>• 최대 크기: 5MB</p>
                  <p>• 권장 크기: 400x400px</p>
                </div>
              </div>
            </div>

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
                      minLength={5}
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

            <div className={styles.securityCard}>
              <h3>🛡️ 보안 가이드</h3>
              <div className={styles.securityTips}>
                <div className={styles.tipItem}>
                  <span className={styles.tipIcon}>🔐</span>
                  <div>
                    <strong>강력한 비밀번호 사용</strong>
                    <p>8자 이상, 영문/숫자/특수문자 조합</p>
                  </div>
                </div>
                <div className={styles.tipItem}>
                  <span className={styles.tipIcon}>🔄</span>
                  <div>
                    <strong>정기적인 비밀번호 변경</strong>
                    <p>3-6개월마다 비밀번호를 변경해주세요</p>
                  </div>
                </div>
                <div className={styles.tipItem}>
                  <span className={styles.tipIcon}>⚠️</span>
                  <div>
                    <strong>비밀번호 재사용 금지</strong>
                    <p>다른 사이트와 동일한 비밀번호 사용 주의</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.settingsCard}>
              <h3>🔔 알림 설정</h3>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <strong>새 댓글 알림</strong>
                    <p>내 글에 댓글이 달렸을 때 알림</p>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <strong>좋아요 알림</strong>
                    <p>내 글이나 댓글에 좋아요를 받았을 때</p>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <strong>일정 알림</strong>
                    <p>새로운 일정이 등록되거나 투표가 있을 때</p>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <strong>이메일 알림</strong>
                    <p>중요한 알림을 이메일로도 받기</p>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
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
    <div className={styles.MyPageRoot}>
    <div className={styles.myPageContainer}>
      <div className={styles.gradientText}>
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
    </div>
  );
}
