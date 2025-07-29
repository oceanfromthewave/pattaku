import '../styles/Header.scss';
import logo from '../assets/pattaku-transparent.png';
import { Link, useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';

export default function Header({ isLogin, setIsLogin }) {
  const navigate = useNavigate();

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

  return (
    <header className="main-header" role="banner">
      <div className="header-content">
        <Link to="/" className="header-home-link" tabIndex={0}>
          <img src={logo} alt="로고" className="header-logo" />
          <span className="header-title">패타쿠 게시판</span>
        </Link>
        <nav className="main-nav" role="navigation" aria-label="메인 메뉴">
          {isLogin && (
            <>
              <Link to="/board/free">자유게시판</Link>
              <Link to="/board/schedule">일정공유</Link>
              <Link to="/mypage">마이페이지</Link>
            </>
          )}
          <DarkModeToggle />
          {!isLogin ? (
            <button className="login-btn" onClick={handleLogin}>로그인</button>
          ) : (
            <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
          )}
        </nav>
      </div>
      {/* header가 fixed일 때 아래 컨텐츠 안 가리도록 여백용 */}
      <div className="header-spacer" aria-hidden />
    </header>
  );
}
