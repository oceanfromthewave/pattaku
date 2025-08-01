const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/comments");
const scheduleRoutes = require("./routes/schedule");
const scheduleVoteRoutes = require("./routes/scheduleVote");
const scheduleCommentRoutes = require("./routes/scheduleComment");
const notificationRoutes = require("./routes/notificationRoutes");
const SocketHandler = require("./socketHandler");

const app = express();
const server = http.createServer(app);

// Socket.io CORS
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      "http://pattaku.s3-website-ap-southeast-2.amazonaws.com",
      "https://pattaku.s3-website-ap-southeast-2.amazonaws.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const socketHandler = new SocketHandler(io);
app.set("socketHandler", socketHandler);

const PORT = process.env.PORT || 5000;

// ------------------- CORS 설정 -------------------
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      "http://pattaku.s3-website-ap-southeast-2.amazonaws.com",
      "https://pattaku.s3-website-ap-southeast-2.amazonaws.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// [★매우중요] 모든 프리플라이트(OPTIONS) 요청 허용 (Preflight CORS)
app.options("*", cors());

// ------------------- 바디파서 -------------------
app.use(express.json());

// ----- [★ 중요] 업로드 파일에 ORB(Cross-Origin-Resource-Policy) 헤더 적용 -----
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath, stat) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// ------------------- 라우터 등록 -------------------
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", commentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/schedules", scheduleVoteRoutes);
app.use("/api/schedules", scheduleCommentRoutes);
app.use("/api/notifications", notificationRoutes);

// --- WebSocket(ws) 서버 추가 ---
const WebSocket = require("ws");
const wsMap = require("./wsNotificationMap");
const wss = new WebSocket.Server({ server });
wss.on("connection", (ws, req) => {
  // 쿼리스트링에서 userId 추출 - 더 안전한 방식
  const url = req.url;
  let userId = null;
  try {
    if (url && url.includes('?')) {
      const urlObj = new URL("ws://localhost" + url);
      userId = urlObj.searchParams.get("userId");
    }
  } catch (e) {
    console.log("WebSocket URL parsing error:", e.message);
  }
  if (userId) {
    wsMap.set(userId, ws);
    console.log("WS 연결:", userId);
  }
  ws.on("close", () => {
    if (userId) wsMap.delete(userId);
    console.log("WS 연결 종료:", userId);
  });
});

server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});