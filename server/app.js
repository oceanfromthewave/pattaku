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

// 허용할 도메인 목록
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://pattaku.s3-website-ap-southeast-2.amazonaws.com",
  "https://pattaku.s3-website-ap-southeast-2.amazonaws.com",
  "https://pattaku.onrender.com"
];

// Socket.io 설정
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
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
  
  socket.on('register_user', (userId) => {
    if (userId) {
      wsNotificationMap.set(userId, socket);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, userSocket] of wsNotificationMap.wsMap.entries()) {
      if (userSocket === socket) {
        wsNotificationMap.delete(userId);
        break;
      }
    }
  });
});

app.set('wsNotificationMap', wsNotificationMap);

const PORT = process.env.PORT || 5000;

// ------------------- CORS 설정 개선 -------------------
const corsOptions = {
  origin: function (origin, callback) {
    // origin이 없는 경우(모바일 앱, Postman 등) 또는 허용 목록에 있는 경우
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS 차단된 도메인:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  exposedHeaders: ["Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// 모든 OPTIONS 요청에 대한 처리
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Accept,Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// ------------------- 바디파서 -------------------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// ------------------- 추가 헤더 설정 -------------------
app.use((req, res, next) => {
  // 요청한 도메인이 허용 목록에 있으면 설정
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Accept,Origin");
  next();
});

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

// ------------------- 에러 핸들링 -------------------
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log(`🔌 Socket.io 실행 중 - 채팅: /, 알림: /notifications`);
  console.log('📋 허용된 도메인:', allowedOrigins);
});