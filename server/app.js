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

// 메모리 제한 설정
const MAX_MEMORY_MB = process.env.NODE_ENV === 'production' ? 350 : 500; // Render 메모리 제한 고려

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

// Socket.io 설정 (메모리 효율화)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  // 메모리 최적화 설정
  maxHttpBufferSize: 1e6, // 1MB로 제한
  pingTimeout: 30000,     // 30초
  pingInterval: 25000,    // 25초
  upgradeTimeout: 10000,  // 10초
  // 연결 제한
  maxConnections: process.env.NODE_ENV === 'production' ? 500 : 100
});

// Socket 핸들러 초기화
let socketHandler;
let chatSocketHandler;

try {
  socketHandler = new SocketHandler(io);
  chatSocketHandler = new ChatSocketHandler(io);
  app.set("socketHandler", socketHandler);
  app.set("chatSocketHandler", chatSocketHandler);
  console.log('✅ Socket handlers 초기화 완료');
} catch (error) {
  console.error('❌ Socket handlers 초기화 실패:', error);
}

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
    // 메모리 누수 방지를 위한 정리
    for (const [userId, userSocket] of wsNotificationMap.wsMap.entries()) {
      if (userSocket === socket) {
        wsNotificationMap.delete(userId);
        break;
      }
    }
  });

  socket.on('error', (error) => {
    console.error('📢 알림 소켓 에러:', error);
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

// ------------------- 바디파서 (메모리 제한) -------------------
app.use(express.json({ 
  limit: '10mb',  // 제한 줄임
  verify: (req, res, buf) => {
    // 요청 크기 체크
    if (buf.length > 10 * 1024 * 1024) { // 10MB
      throw new Error('요청이 너무 큽니다');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000  // 매개변수 수 제한
}));

// ------------------- 정적 파일 서비스 -------------------
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath, stat) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      // 캐시 헤더 추가 (메모리 절약)
      res.set("Cache-Control", "public, max-age=86400"); // 24시간
    },
    maxAge: '1d' // 1일 캐시
  })
);

// ------------------- 추가 헤더 설정 -------------------
app.use((req, res, next) => {
  // 메모리 사용량 체크 미들웨어
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  if (memUsedMB > MAX_MEMORY_MB) {
    console.warn(`⚠️ 메모리 사용량 경고: ${memUsedMB}MB / ${MAX_MEMORY_MB}MB`);
    
    // 메모리 정리 시도
    if (global.gc) {
      global.gc();
      console.log('🗑️ 가비지 컬렉션 실행');
    }
  }

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

// ------------------- 요청 크기 제한 미들웨어 -------------------
app.use((req, res, next) => {
  const contentLength = req.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    return res.status(413).json({ error: '요청이 너무 큽니다' });
  }
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

// ------------------- 헬스체크 엔드포인트 -------------------
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'OK',
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    },
    uptime: process.uptime(),
    connections: io.engine.clientsCount
  });
});

// ------------------- 에러 핸들링 -------------------
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  
  // 메모리 관련 에러 체크
  if (err.message && err.message.includes('heap')) {
    console.error('💀 메모리 부족 에러 감지');
    if (global.gc) {
      global.gc();
    }
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
});

// ------------------- 404 처리 -------------------
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ------------------- 메모리 모니터링 -------------------
let memoryWarningCount = 0;
const startMemoryMonitoring = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (memUsedMB > MAX_MEMORY_MB) {
      memoryWarningCount++;
      console.warn(`⚠️ 메모리 사용량 경고 #${memoryWarningCount}: ${memUsedMB}MB / ${MAX_MEMORY_MB}MB`);
      
      // 연속 경고시 강제 가비지 컬렉션
      if (memoryWarningCount >= 3 && global.gc) {
        global.gc();
        memoryWarningCount = 0;
        console.log('🗑️ 강제 가비지 컬렉션 실행');
      }
    } else if (memoryWarningCount > 0) {
      memoryWarningCount = 0; // 메모리가 정상으로 돌아오면 카운터 리셋
    }
    
    // 개발 환경에서만 로그 출력
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 메모리 사용량:', {
        heap: `${memUsedMB}MB`,
        connections: io.engine.clientsCount
      });
    }
  }, 30000); // 30초마다
};

// ------------------- Graceful Shutdown -------------------
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 ${signal} 신호 수신 - 서버 종료 시작...`);
  
  try {
    // 새로운 연결 거부
    server.close(() => {
      console.log('✅ HTTP 서버 종료');
    });
    
    // Socket.io 정리
    if (chatSocketHandler && typeof chatSocketHandler.cleanup === 'function') {
      chatSocketHandler.cleanup();
    }
    
    // 모든 소켓 연결 종료
    io.close(() => {
      console.log('✅ Socket.io 서버 종료');
    });
    
    // 알림 맵 정리
    wsNotificationMap.clear();
    
    console.log('✅ 정리 작업 완료');
    process.exit(0);
  } catch (error) {
    console.error('❌ 종료 중 오류:', error);
    process.exit(1);
  }
};

// 시그널 핸들러 등록
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 처리되지 않은 예외 처리
process.on('uncaughtException', (error) => {
  console.error('💀 처리되지 않은 예외:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💀 처리되지 않은 Promise 거부:', reason);
  gracefulShutdown('unhandledRejection');
});

// ------------------- 서버 시작 -------------------
server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log(`🔌 Socket.io 실행 중 - 채팅: /, 알림: /notifications`);
  console.log('📋 허용된 도메인:', allowedOrigins);
  console.log(`🧠 메모리 제한: ${MAX_MEMORY_MB}MB`);
  
  // 메모리 모니터링 시작
  startMemoryMonitoring();
});