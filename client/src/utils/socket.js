import { io } from "socket.io-client";
import { WS_URL } from "../api/config";

const SOCKET_SERVER_URL = WS_URL;

const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false, // 수동으로 연결
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("✅ Socket connected", socket.id);
  const token = localStorage.getItem("token");
  if (token) {
    socket.emit("authenticate", token);
  }
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket disconnected", reason);
});

socket.on("connect_error", (error) => {
  console.error("🚨 Socket connection error", error);
});

socket.on("authenticated", (data) => {
  if (data.success) {
    console.log("🔑 Socket authenticated", data.userId);
  } else {
    console.error("🚫 Socket authentication failed", data.error);
    // 인증 실패 시 토큰 제거 등 추가 처리 필요
  }
});

export default socket;
