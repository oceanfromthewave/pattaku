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
import EditPostForm from './components/Posts/EditPostForm';
import ScheduleForm from './components/Schedule/ScheduleForm';
import ScheduleList from './components/Schedule/ScheduleList';
import ScheduleDetail from './components/Schedule/ScheduleDetail';
import { useState,useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Modal from "./components/Modal";

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
  const [showExpireModal, setShowExpireModal] = useState(false);

  useEffect(() => {
    const checkLoginExpire = () => {
      const loginTime = Number(localStorage.getItem('loginTime'));
      if (!loginTime) return;
      if (Date.now() - loginTime > 3600 * 1000) {
        setShowExpireModal(true);
        // 로그아웃 처리
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('nickname');
        localStorage.removeItem('loginTime');
        setIsLogin(false); // 상태도 false로!
      }
    };
    const timer = setInterval(checkLoginExpire, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
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
        <Route path="/board/free/:postId/edit" element={
          <div className="center-container"><EditPostForm /></div>
        } />
        <Route path="/board/schedule/:id" element={
          <div className="center-container"><ScheduleDetail isLogin={isLogin} /></div>
        } />
      </Routes>

      {/* 1시간 만료 모달 */}
      {showExpireModal && (
        <Modal onClose={() => {
          setShowExpireModal(false);
          window.location.href = '/board/free'; // 로그인페이지, 홈 등 원하는 곳으로 이동
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>로그인 세션 만료</h2>
            <p>1시간이 경과되어 다시 로그인해야 합니다.</p>
            <button
              onClick={() => {
                setShowExpireModal(false);
                window.location.href = '/board/free'; // 로그인페이지, 홈 등으로 이동
              }}
              style={{ marginTop: '1rem', padding: '0.6rem 1.5rem' }}
            >
              확인
            </button>
          </div>
        </Modal>
      )}
    </Router>
  );
}
export default App;