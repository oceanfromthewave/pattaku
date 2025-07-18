import './styles/main.scss';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from './components/Header';
import Home from './components/Home';
import RegisterForm from './components/Auth/RegisterForm';
import LoginForm from './components/Auth/LoginForm';
import PostForm from './components/Posts/PostForm';
import PostList from './components/Posts/PostList';
import PostDetail from './components/Posts/PostDetail';
import ScheduleForm from './components/Schedule/ScheduleForm';
import ScheduleList from './components/Schedule/ScheduleList';
import ScheduleDetail from './components/Schedule/ScheduleDetail';
import { useState, createContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 테마(다크/라이트) context 생성
export const ThemeContext = createContext();

function FreeBoardPage({ isLogin, setIsLogin }) {
  const [showRegister, setShowRegister] = useState(false);
  const handleRegisterSuccess = () => setShowRegister(false);

  return (
    <div className="center-container">
      {!isLogin ? (
        !showRegister ? (
          <>
            <LoginForm onLogin={() => setIsLogin(true)} />
            <div className="to-register">
              아이디가 없으신가요?{' '}
              <button className="link-btn" onClick={() => setShowRegister(true)}>
                회원가입
              </button>
            </div>
          </>
        ) : (
          <>
            <RegisterForm onSuccess={handleRegisterSuccess} />
            <div className="to-login">
              <button className="link-btn" onClick={() => setShowRegister(false)}>
                로그인 화면으로 돌아가기
              </button>
            </div>
          </>
        )
      ) : (
        <>
          <PostForm onPost={() => window.location.reload()} />
          <PostList />
        </>
      )}
    </div>
  );
}

function ScheduleBoardPage({ isLogin, setIsLogin }) {
  const [showRegister, setShowRegister] = useState(false);
  const handleRegisterSuccess = () => setShowRegister(false);

  return (
    <div className="center-container">
      {!isLogin ? (
        <div>
          <h2 className="app-title">일정공유</h2>
          {!showRegister ? (
            <>
              <LoginForm onLogin={() => setIsLogin(true)} />
              <div className="to-register">
                아이디가 없으신가요?{' '}
                <button className="link-btn" onClick={() => setShowRegister(true)}>
                  회원가입
                </button>
              </div>
            </>
          ) : (
            <>
              <RegisterForm onSuccess={handleRegisterSuccess} />
              <div className="to-login">
                <button className="link-btn" onClick={() => setShowRegister(false)}>
                  로그인 화면으로 돌아가기
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <ScheduleForm onAdd={() => window.location.reload()} />
          <ScheduleList />
        </>
      )}
    </div>
  );
}

function App() {
  const [isLogin, setIsLogin] = useState(() => !!localStorage.getItem('token'));
  // 다크모드 상태관리
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Router>
        <Header isLogin={isLogin} setIsLogin={setIsLogin} />
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/" element={
            <div className="center-container"><Home /></div>
          } />
          <Route path="/board/free" element={
            <FreeBoardPage isLogin={isLogin} setIsLogin={setIsLogin} />
          } />
          <Route path="/board/schedule" element={
            <ScheduleBoardPage isLogin={isLogin} setIsLogin={setIsLogin} />
          } />
          <Route path="/board/free/:postId" element={
            <div className="center-container"><PostDetail isLogin={isLogin} /></div>
          } />
          <Route path="/board/schedule/:id" element={
            <div className="center-container"><ScheduleDetail isLogin={isLogin} /></div>
          } />
        </Routes>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
