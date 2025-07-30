import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Header from './components/Header';
import Home from './components/Home';
import PostList from './components/Posts/PostList';
import PostDetail from './components/Posts/PostDetail';
import EditPostForm from './components/Posts/EditPostForm';
import ScheduleList from './components/Schedule/ScheduleList';
import ScheduleDetail from './components/Schedule/ScheduleDetail';
import MyPage from './components/MyPage/MyPage';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/main.scss';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 로그인 상태 확인
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userInfoStr = localStorage.getItem('userInfo');
    
    if (token && userId) {
      setIsLoggedIn(true);
      if (userInfoStr) {
        try {
          setUserInfo(JSON.parse(userInfoStr));
        } catch (e) {
          setUserInfo({ id: userId });
        }
      } else {
        setUserInfo({ id: userId });
      }
    }

    // 다크모드 상태 확인
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  // 로그인 상태 업데이트 함수
  const updateAuthState = () => {
    const token = localStorage.getItem('token');
    const userInfoStr = localStorage.getItem('userInfo');
    
    if (token) {
      setIsLoggedIn(true);
      if (userInfoStr) {
        try {
          setUserInfo(JSON.parse(userInfoStr));
        } catch (e) {
          setUserInfo({ nickname: '사용자' });
        }
      }
    } else {
      setIsLoggedIn(false);
      setUserInfo(null);
    }
  };

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={<LoginForm onLoginSuccess={updateAuthState} />} 
            />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/posts" element={<PostList />} />
            <Route path="/posts/:postId" element={<PostDetail />} />
            <Route path="/posts/:postId/edit" element={<EditPostForm />} />
            <Route path="/schedules" element={<ScheduleList />} />
            <Route 
              path="/schedules/:scheduleId" 
              element={<ScheduleDetail isLogin={isLoggedIn} />} 
            />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="*" element={
              <div className="page-container">
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <h3>404 - 페이지를 찾을 수 없습니다</h3>
                  <p>요청하신 페이지가 존재하지 않습니다.</p>
                  <button 
                    className="btn btn-primary mt-md"
                    onClick={() => window.history.back()}
                  >
                    ← 이전 페이지로
                  </button>
                </div>
              </div>
            } />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* 토스트 알림 */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
        style={{
          zIndex: 9999,
        }}
      />
    </div>
  );
}

export default App;
