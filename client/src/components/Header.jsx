import '../styles/Header.scss';
import logo from '../assets/pattaku-transparent.png';
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { ThemeContext } from '../App';

export default function Header({ isLogin, setIsLogin }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useContext(ThemeContext);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('nickname');
    setIsLogin(false);
    navigate('/');
  }
  function handleLogin() {
    navigate('/board/free');
  }

  // 토글버튼(아이콘 or 텍스트)
  return (
    <header className="main-header">
      <div className="header-content">
        <Link to="/" className="header-home-link">
          <img src={logo} alt="로고" className="header-logo" />
          <span className="header-title">패타쿠 게시판</span>
        </Link>
        <nav className="main-nav">
          {isLogin && (
            <>
              <Link to="/board/free">자유게시판</Link>
              <Link to="/board/schedule">일정공유</Link>
            </>
          )}
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title={theme === "light" ? "다크모드" : "라이트모드"}
          >
            {theme === "light" ? "🌙" : "🌞"}
          </button>
          {!isLogin ? (
            <button className="login-btn" onClick={handleLogin}>로그인</button>
          ) : (
            <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
          )}
        </nav>
      </div>
    </header>
  );
}
