import styles from '../styles/Home.module.scss';
import logo from '../assets/pattaku-transparent.png';


export default function Home() {
  return (
    <main className={styles['home-root']} role="main">
      <section className={styles['home-wrap']} aria-label="패타쿠 커뮤니티 메인 안내">
        <img src={logo} className={styles['home-logo']} alt="패타쿠 로고" />
        <h1 className={styles['home-title']}>패타쿠 커뮤니티에 오신 것을 환영합니다!</h1>
        <p>
          <span className={styles['home-strong']}>패타쿠</span>는 누구나 자유롭게 이야기를 나누고
          <br />
          소소한 일상부터 다양한 일정까지 함께 공유하는<br />
          아늑하고 빠른 오픈 커뮤니티입니다.<br />
        </p>
        <div className={styles['home-desc']}>
          <span>🚀 지금 로그인하면 커뮤니티 모든 기능을 바로 사용할 수 있습니다.</span>
        </div>
      </section>
    </main>
  );
}
