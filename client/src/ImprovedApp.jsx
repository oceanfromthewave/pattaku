import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, ThemeProvider, CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import ImprovedHeader from './components/ImprovedHeader';
import { DarkModeProvider, useDarkMode } from './components/EnhancedDarkModeToggle';
import { createCustomTheme } from './theme/customTheme';
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
import Loading from './components/Loading';
import 'react-toastify/dist/ReactToastify.css';

// 테마를 적용하는 내부 컴포넌트
function ThemedApp() {
  const { isDark } = useDarkMode();
  const theme = createCustomTheme(isDark);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: isDark
            ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)'
            : 'linear-gradient(135deg, #fafafa 0%, #ffffff 50%, #f5f5f5 100%)',
          transition: 'all 0.3s ease',
        }}
      >
        <ImprovedHeader />
        
        <Container 
          maxWidth="lg" 
          sx={{ 
            mt: 4, 
            mb: 4,
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/posts" element={<PostList />} />
              <Route path="/posts/:postId" element={<PostDetail />} />
              <Route path="/posts/:postId/edit" element={<EditPostForm />} />
              <Route path="/schedules" element={<ScheduleList />} />
              <Route path="/schedules/:scheduleId" element={<ScheduleDetail />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="*" element={
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <h2>404 - 페이지를 찾을 수 없습니다</h2>
                  <p>요청하신 페이지가 존재하지 않습니다.</p>
                </Box>
              } />
            </Routes>
          </ErrorBoundary>
        </Container>

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
          theme={isDark ? 'dark' : 'light'}
          style={{
            zIndex: 9999,
          }}
        />
      </Box>
    </ThemeProvider>
  );
}

// 메인 앱 컴포넌트
function ImprovedApp() {
  return (
    <DarkModeProvider>
      <ThemedApp />
    </DarkModeProvider>
  );
}

export default ImprovedApp;
