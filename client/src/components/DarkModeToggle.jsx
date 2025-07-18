import { useEffect, useState } from "react";
import styles from "../styles/DarkModeToggle.module.scss";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    // prefers-color-scheme 지원시 시스템 다크모드 적용
    const theme = localStorage.getItem("theme");
    if (theme) return theme === "dark";
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return true;
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      className={styles.toggle}
      aria-label={dark ? "라이트모드로 변경" : "다크모드로 변경"}
      onClick={() => setDark(v => !v)}
      title={dark ? "라이트모드로 변경" : "다크모드로 변경"}
      tabIndex={0}
    >
      <span className={styles.iconWrap} aria-hidden>
        {dark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}

function SunIcon() {
  // SVG로 훨씬 더 예쁘게(아이콘 폰트대신)
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
      <circle cx="12" cy="12" r="5.2"/>
      <g>
        <line x1="12" y1="2.1" x2="12" y2="4.1"/>
        <line x1="12" y1="19.9" x2="12" y2="21.9"/>
        <line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/>
        <line x1="18.4" y1="18.4" x2="19.8" y2="19.8"/>
        <line x1="2.1" y1="12" x2="4.1" y2="12"/>
        <line x1="19.9" y1="12" x2="21.9" y2="12"/>
        <line x1="4.2" y1="19.8" x2="5.6" y2="18.4"/>
        <line x1="18.4" y1="5.6" x2="19.8" y2="4.2"/>
      </g>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
      <path d="M21 12.7A9 9 0 0 1 11.3 3c-.3 0-.5.2-.6.5s0 .7.3.8A7.2 7.2 0 0 0 12 21c4.4 0 8-3.6 8-8 0-.2-.1-.3-.3-.4s-.4 0-.6.1z"/>
    </svg>
  );
}
