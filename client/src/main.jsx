// 다크모드 기본 body 적용 (앱 렌더 전)
const theme = localStorage.getItem("theme");
if (
  theme === "dark" ||
  (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.body.classList.add("dark");
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/main.scss"; // 반드시 포함

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
