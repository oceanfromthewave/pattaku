// src/utils/useDarkMode.js
import { useEffect, useState } from "react";

export default function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const theme = localStorage.getItem("theme");
    if (theme) return theme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light"
    );
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, setDark];
}
