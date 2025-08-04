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
const chatRoutes = require("./routes/chatRoutes");
const SocketHandler = require("./socketHandler");
const ChatSocketHandler = require("./socket/chatSocketHandler");
const wsNotificationMap = require('./wsNotificationMap');

const app = express();
const server = http.createServer(app);

// Socket.io 설정
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

// Socket 핸들러 초기화
const socketHandler = new SocketHandler(io);
const chatSocketHandler = new ChatSocketHandler(io);
app.set("socketHandler", socketHandler);
app.set("chatSocketHandler", chatSocketHandler);

// 알림 네임스페이스 설정
const notificationNamespace = io.of('/notifications');
notificationNamespace.on('connection', (socket) => {
  console.log('📢 알림 소켓 연결:', socket.id);
  
  // 사용자 등록
  socket.on('register_user', (userId) => {
    if (userId) {
      wsNotificationMap.set(userId, socket);
    }
  });

  socket.on('disconnect', () => {
    // 연결 해제 시 맵에서 제거
    for (const [userId, userSocket] of wsNotificationMap.wsMap.entries()) {
      if (userSocket === socket) {
        wsNotificationMap.delete(userId);
        break;
      }
    }
  });
});

// wsNotificationMap을 앱에 설정
app.set('wsNotificationMap', wsNotificationMap);

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

app.options("*", cors());

// ------------------- 바디파서 -------------------
app.use(express.json());

// ------------------- 정적 파일 서비스 -------------------
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
app.use("/api/chat", chatRoutes);

server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log(`🔌 Socket.io 실행 중 - 채팅: /, 알림: /notifications`);
});