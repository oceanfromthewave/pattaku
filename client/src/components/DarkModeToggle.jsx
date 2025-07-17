// src/components/DarkModeToggle.jsx
import { useEffect, useState } from "react";
import styles from "../styles/DarkModeToggle.module.scss";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      className={styles.toggle}
      aria-label="다크모드 토글"
      onClick={() => setDark((v) => !v)}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
