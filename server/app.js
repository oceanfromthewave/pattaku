const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http"); // http 모듈 추가
const { Server } = require("socket.io"); // Socket.io Server 클래스 추가
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/comments");
const scheduleRoutes = require("./routes/schedule");
const scheduleVoteRoutes = require("./routes/scheduleVote");
const scheduleCommentRoutes = require("./routes/scheduleComment");
const notificationRoutes = require("./routes/notificationRoutes"); // 알림 라우트 추가
const SocketHandler = require("./socketHandler"); // SocketHandler 임포트

const app = express();
const server = http.createServer(app); // http 서버 생성
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173", 
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      "http://pattaku.s3-website-ap-southeast-2.amazonaws.com",
      "https://pattaku.s3-website-ap-southeast-2.amazonaws.com"
    ],
    methods: ["GET", "POST"],
  },
}); // Socket.io 서버 생성

const socketHandler = new SocketHandler(io); // SocketHandler 인스턴스 생성

// notificationService에서 socketHandler를 사용할 수 있도록 내보냅니다.
app.set("socketHandler", socketHandler);

const PORT = process.env.PORT || 5000;

// CORS 설정
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://127.0.0.1:3000',
    'http://pattaku.s3-website-ap-southeast-2.amazonaws.com',
    'https://pattaku.s3-website-ap-southeast-2.amazonaws.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 이미지 업로드 폴더 정적 제공 (CORS 헤더 추가)
app.use("/uploads", (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", commentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/schedules", scheduleVoteRoutes);
app.use("/api/schedules", scheduleCommentRoutes);
app.use("/api/notifications", notificationRoutes); // 알림 라우트 사용


// --- WebSocket(ws) 서버 추가 ---
const WebSocket = require('ws');
const wsMap = require('./wsNotificationMap');
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws, req) => {
  // 쿼리스트링에서 userId 추출
  const url = req.url;
  let userId = null;
  try {
    userId = new URL('ws://localhost' + url).searchParams.get('userId');
  } catch (e) {}
  if (userId) {
    wsMap.set(userId, ws);
    console.log('WS 연결:', userId);
  }
  ws.on('close', () => {
    if (userId) wsMap.delete(userId);
    console.log('WS 연결 종료:', userId);
  });
});

server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
