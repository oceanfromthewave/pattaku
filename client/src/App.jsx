import './styles/main.scss';
import './styles/theme.scss';
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
    <div>
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
    <div>
      <h2 className="app-title">일정공유</h2>
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

  // 테마 변경 시 html/body 클래스 토글
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Router>
        <Header isLogin={isLogin} setIsLogin={setIsLogin} />
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/board/free" element={<FreeBoardPage isLogin={isLogin} setIsLogin={setIsLogin} />} />
            <Route path="/board/schedule" element={<ScheduleBoardPage isLogin={isLogin} setIsLogin={setIsLogin} />} />
            <Route path="/board/free/:postId" element={<PostDetail isLogin={isLogin} />} />
            <Route path="/board/schedule/:id" element={<ScheduleDetail isLogin={isLogin} />} />
          </Routes>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
