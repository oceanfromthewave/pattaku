import '../styles/Home.module.scss';

export default function Home() {
  return (
    <div className="home-root">
      <div className="home-wrap">
        <img src="/logo192.png" className="home-logo" alt="패타쿠 로고" />
        <h2>패타쿠 커뮤니티에 오신 것을 환영합니다!</h2>
        <p>
          <span className="home-strong">패타쿠</span>는 누구나 자유롭게 이야기를 나누고
          <br />
          소소한 일상부터 다양한 일정까지 함께 공유하는<br />
          아늑하고 빠른 오픈 커뮤니티입니다.<br />
          <br />
          게시판 이용은 <span className="home-highlight">상단 메뉴</span>에서<br />
          자유게시판, 일정공유를 선택해 시작하세요!
        </p>
        <div className="home-desc">
          <span>🚀 지금 로그인하면 커뮤니티 모든 기능을 바로 사용할 수 있습니다.</span>
        </div>
      </div>
    </div>
  );
}
