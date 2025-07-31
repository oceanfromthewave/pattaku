import React, { createContext, useContext, useState, useEffect } from 'react';
import { setTokenExpiredHandler } from '../api/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);

  // 로그인 상태 확인 함수
  const checkAuthState = () => {
    const token = localStorage.getItem('token');
    const userInfoStr = localStorage.getItem('userInfo');
    
    if (token) {
      setIsLoggedIn(true);
      if (userInfoStr) {
        try {
          const parsedUserInfo = JSON.parse(userInfoStr);
          setUserInfo(parsedUserInfo);
          console.log('🔄 로그인 상태 복원:', parsedUserInfo);
        } catch (error) {
          console.error('유저 정보 파싱 오류:', error);
          setUserInfo({ nickname: '사용자' });
        }
      }
    } else {
      setIsLoggedIn(false);
      setUserInfo(null);
    }
    setLoading(false);
  };

  // 로그인 함수
  const login = (token, userId, username, nickname, profileImage = null) => {
    const userInfo = {
      id: userId,
      username: username,
      nickname: nickname,
      profileImage: profileImage
    };
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    
    setIsLoggedIn(true);
    setUserInfo(userInfo);
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    setIsLoggedIn(false);
    setUserInfo(null);
  };

  // 토큰 만료 모달 표시
  const showTokenExpired = () => {
    setShowTokenExpiredModal(true);
  };

  // 토큰 만료 모달 확인 처리
  const handleTokenExpiredConfirm = () => {
    setShowTokenExpiredModal(false);
    logout();
    window.location.href = '/login';
  };

  // 사용자 정보 업데이트 (프로필 사진 변경 등)
  const updateUserInfo = (updatedInfo) => {
    const currentUserInfo = userInfo || {};
    const newUserInfo = { ...currentUserInfo, ...updatedInfo };
    
    setUserInfo(newUserInfo);
    localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
  };

  // 컴포넌트 마운트시 인증 상태 확인
  useEffect(() => {
    checkAuthState();
    // apiClient에 토큰 만료 핸들러 등록
    setTokenExpiredHandler(showTokenExpired);
  }, []);

  const value = {
    isLoggedIn,
    userInfo,
    loading,
    login,
    logout,
    checkAuthState,
    updateUserInfo,
    showTokenExpired,
    showTokenExpiredModal,
    handleTokenExpiredConfirm
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
