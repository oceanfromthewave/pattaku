// src/components/Header.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import DarkModeToggle from "./DarkModeToggle";
import styles from "../styles/Header.module.scss";
import logo from "../assets/pattaku-transparent.png";

export default function Header({ isLogin, setIsLogin }) {
  function handleLogout() {
    localStorage.clear();
    setIsLogin(false);
    window.location.href = "/";
  }
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logoWrap}>
          <img src={logo} alt="logo" className={styles.logo} />
          <span className={styles.title}>패타쿠 게시판</span>
        </Link>
        <nav>
          {isLogin && (
            <>
              <Link to="/board/free">자유게시판</Link>
              <Link to="/board/schedule">일정공유</Link>
            </>
          )}
          <DarkModeToggle />
          {!isLogin ? (
            <Link className={styles.loginBtn} to="/board/free">로그인</Link>
          ) : (
            <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
          )}
        </nav>
      </div>
    </header>
  );
}
