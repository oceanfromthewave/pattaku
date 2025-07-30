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

// 개선된 소켓 핸들러와 알림 서비스 사용
const ImprovedSocketHandler = require("./improvedSocketHandler");
const NotificationService = require("./improvedNotificationService");

const app = express();
const server = http.createServer(app);

// Socket.IO 서버 설정 (개선된 CORS 설정)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// 개선된 소켓 핸들러 인스턴스 생성
const socketHandler = new ImprovedSocketHandler(io);
const notificationService = new NotificationService(socketHandler);

// Express 앱에 소켓 핸들러와 알림 서비스 등록
app.set("socketHandler", socketHandler);
app.set("notificationService", notificationService);

const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors({
  origin: process.env.CLIENT_URL || ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 제공
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 라우트 설정
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", commentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/schedules", scheduleVoteRoutes);
app.use("/api/schedules", scheduleCommentRoutes);
app.use("/api/notifications", notificationRoutes);

// 헬스체크 엔드포인트
app.get("/api/health", (req, res) => {
  const stats = socketHandler.getDetailedStats();
  res.json({
    status: "healthy",
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    socketStats: stats,
  });
});

// 관리자용 소켓 통계 엔드포인트
app.get("/api/admin/socket-stats", (req, res) => {
  // 실제 환경에서는 관리자 인증 필요
  const stats = socketHandler.getDetailedStats();
  res.json(stats);
});

// 기존 WebSocket 서버 (하위 호환성을 위해 유지, 추후 제거 예정)
const WebSocket = require('ws');
const wsMap = require('./wsNotificationMap');
const wss = new WebSocket.Server({ 
  server,
  path: '/ws' // 경로 분리로 충돌 방지
});

wss.on('connection', (ws, req) => {
  console.log('🔌 레거시 WS 연결 (곧 제거 예정)');
  
  const url = req.url;
  let userId = null;
  try {
    userId = new URL('ws://localhost' + url).searchParams.get('userId');
  } catch (e) {
    console.warn('레거시 WS userId 파싱 실패:', e.message);
  }
  
  if (userId) {
    wsMap.set(userId, ws);
    console.log('🔌 레거시 WS 연결:', userId);
  }
  
  ws.on('close', () => {
    if (userId) wsMap.delete(userId);
    console.log('🔌 레거시 WS 연결 종료:', userId);
  });
  
  ws.on('error', (error) => {
    console.error('🚨 레거시 WS 에러:', error);
  });
});

// 404 에러 핸들러
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `경로 ${req.originalUrl}을 찾을 수 없습니다.`,
    timestamp: new Date(),
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error('🚨 서버 에러:', error);
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
    timestamp: new Date(),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log('🚀 Pattaku 서버 시작됨');
  console.log(`📍 서버 주소: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO 경로: http://localhost:${PORT}/socket.io/`);
  console.log(`🌐 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ 시작 시간: ${new Date().toLocaleString('ko-KR')}`);
});

// 우아한 종료 처리
const gracefulShutdown = (signal) => {
  console.log(`\n📴 ${signal} 신호 수신, 서버 종료 중...`);
  
  // 새로운 연결 거부
  server.close((err) => {
    if (err) {
      console.error('❌ 서버 종료 중 오류:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP 서버 종료 완료');
    
    // 소켓 연결 정리
    socketHandler.cleanup();
    
    // 프로세스 종료
    setTimeout(() => {
      console.log('✅ 서버 종료 완료');
      process.exit(0);
    }, 2000);
  });
};

// 종료 신호 처리
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 처리되지 않은 에러 및 Promise 거부 처리
process.on('uncaughtException', (error) => {
  console.error('🚨 처리되지 않은 예외:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 처리되지 않은 Promise 거부:', reason);
  console.error('🚨 Promise:', promise);
  // 프로덕션에서는 프로세스를 종료할 수 있음
  // process.exit(1);
});

module.exports = app;
