import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import Header from './components/Header';
import Home from './components/Home';
import ErrorBoundary from './components/ErrorBoundary';
import TokenExpiredModal from './components/TokenExpiredModal';
import Loading from './components/Loading';

// 동적 임포트로 코드 스플리팅
const PostList = React.lazy(() => import('./components/Posts/PostList'));
const PostDetail = React.lazy(() => import('./components/Posts/PostDetail'));
const PostForm = React.lazy(() => import('./components/Posts/PostForm'));
const EditPostForm = React.lazy(() => import('./components/Posts/EditPostForm'));
const ScheduleList = React.lazy(() => import('./components/Schedule/ScheduleList'));
const ScheduleDetail = React.lazy(() => import('./components/Schedule/ScheduleDetail'));
const ScheduleForm = React.lazy(() => import('./components/Schedule/ScheduleForm'));
const EditScheduleForm = React.lazy(() => import('./components/Schedule/EditScheduleForm'));
const ChatRoomList = React.lazy(() => import('./components/Chat/ChatRoomList'));
const ChatRoom = React.lazy(() => import('./components/Chat/ChatRoom'));
const MyPage = React.lazy(() => import('./components/MyPage/MyPage'));
const LoginForm = React.lazy(() => import('./components/Auth/LoginForm'));
const RegisterForm = React.lazy(() => import('./components/Auth/RegisterForm'));
const DebugApiConfig = React.lazy(() => import('./components/DebugApiConfig'));
const DevStatusDashboard = React.lazy(() => import('./components/DevStatusDashboard'));
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
            <Suspense fallback={<Loading />}>
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
            </Suspense>
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