import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import Header from './components/Header';
import Home from './components/Home';
import PostList from './components/Posts/PostList';
import PostDetail from './components/Posts/PostDetail';
import PostForm from './components/Posts/PostForm';
import EditPostForm from './components/Posts/EditPostForm';
import ScheduleList from './components/Schedule/ScheduleList';
import ScheduleDetail from './components/Schedule/ScheduleDetail';
import ScheduleForm from './components/Schedule/ScheduleForm';
import EditScheduleForm from './components/Schedule/EditScheduleForm';
import ChatRoomList from './components/Chat/ChatRoomList';
import ChatRoom from './components/Chat/ChatRoom';
import MyPage from './components/MyPage/MyPage';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ErrorBoundary from './components/ErrorBoundary';
import TokenExpiredModal from './components/TokenExpiredModal';
import DebugApiConfig from './components/DebugApiConfig';
import DevStatusDashboard from './components/DevStatusDashboard';
import './styles/main.scss';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { isLoggedIn, showTokenExpiredModal, handleTokenExpiredConfirm } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 다크모드 상태 확인
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  return (
    <ChatProvider>
      <div className="app-container">
        <Header />
        
        <main className="main-content">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route 
                path="/login" 
                element={<LoginForm />} 
              />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/posts" element={<PostList />} />
              <Route path="/posts/new" element={<PostForm />} />
              <Route path="/posts/:postId" element={<PostDetail />} />
              <Route path="/posts/:postId/edit" element={<EditPostForm />} />
              <Route path="/schedules" element={<ScheduleList />} />
              <Route path="/schedules/new" element={<ScheduleForm />} />
              <Route 
                path="/schedules/:scheduleId" 
                element={<ScheduleDetail isLogin={isLoggedIn} />} 
              />
              <Route path="/schedules/:scheduleId/edit" element={<EditScheduleForm />} />
              
              {/* 채팅 라우트 */}
              <Route path="/chat" element={<ChatRoomList />} />
              <Route path="/chat/:roomId" element={<ChatRoom />} />
              
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

        {/* 토큰 만료 모달 */}
        <TokenExpiredModal
          isOpen={showTokenExpiredModal}
          onConfirm={handleTokenExpiredConfirm}
        />
        
        {/* API 설정 디버깅 (개발환경에서만) */}
        <DebugApiConfig />
        
        {/* 개발 상태 대시보드 (개발환경에서만) */}
        <DevStatusDashboard />
      </div>
    </ChatProvider>
  );
}

export default App;