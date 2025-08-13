const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const compression = require("compression");
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
const aiRoutes = require("./routes/aiRoutes"); // AI 라우트 추가
const SocketHandler = require("./socketHandler");
const ChatSocketHandler = require("./socket/chatSocketHandler");
const wsNotificationMap = require('./wsNotificationMap');

const app = express();
const server = http.createServer(app);

// 메모리 제한 설정
const MAX_MEMORY_MB = process.env.NODE_ENV === 'production' ? 350 : 500;

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
  maxHttpBufferSize: 1e6,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
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

// CORS 설정
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS 요청 origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS 차단된 도메인:', origin);
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

// HTTP 응답 압축 (네트워크 최적화)
app.use(compression({
  filter: (req, res) => {
    // 압축 제외할 파일 타입
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // 이미지는 이미 압축되어 있으므로 제외
    const contentType = res.getHeader('content-type') || '';
    if (contentType.startsWith('image/')) {
      return false;
    }
    
    return compression.filter(req, res);
  },
  level: 6, // 압축 레벨 (1-9, 6이 기본값)
  threshold: 1024, // 1KB 이상만 압축
  memLevel: 8 // 메모리 사용량 (1-9)
}));

app.use(cors(corsOptions));

// OPTIONS 요청 처리
app.options("*", (req, res) => {
  console.log('🛡️ OPTIONS 요청:', req.url, 'Origin:', req.headers.origin);
  const origin = req.headers.origin;
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }
  
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Accept,Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");
  res.sendStatus(200);
});

// 바디파서 설정
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    if (buf.length > 10 * 1024 * 1024) {
      throw new Error('요청이 너무 큽니다');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

// 정적 파일 서비스 (최적화)
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath, stat) => {
      const ext = path.extname(filePath).toLowerCase();
      
      // CORS 헤더
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      
      // 이미지 파일은 더 긴 캐시
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].includes(ext)) {
        res.set("Cache-Control", "public, max-age=2592000, immutable"); // 30일
        res.set("Expires", new Date(Date.now() + 2592000000).toUTCString());
      } else {
        res.set("Cache-Control", "public, max-age=86400"); // 1일
      }
      
      // ETag와 Last-Modified 설정
      res.set("ETag", `"${stat.mtime.getTime()}-${stat.size}"`);
      res.set("Last-Modified", stat.mtime.toUTCString());
      
      // 압축 힌트
      if (ext === '.svg') {
        res.set("Content-Type", "image/svg+xml");
        res.set("Content-Encoding", "gzip");
      }
    },
    maxAge: '30d', // 기본 30일
    etag: true,
    lastModified: true
  })
);

// 추가 헤더 설정 및 메모리 체크
app.use((req, res, next) => {
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  if (memUsedMB > MAX_MEMORY_MB) {
    console.warn(`⚠️ 메모리 사용량 경고: ${memUsedMB}MB / ${MAX_MEMORY_MB}MB`);
    
    if (global.gc) {
      global.gc();
      console.log('🗑️ 가비지 컬렉션 실행');
    }
  }

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Accept,Origin");
  next();
});

// 요청 크기 제한
app.use((req, res, next) => {
  const contentLength = req.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return res.status(413).json({ error: '요청이 너무 큽니다' });
  }
  next();
});

// API 요청 로깅
app.use('/api', (req, res, next) => {
  console.log(`🌐 API 요청: ${req.method} ${req.originalUrl}`);
  console.log(`   Origin: ${req.headers.origin}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
  if (req.headers.authorization) {
    console.log(`   인증: 토큰 있음`);
  }
  next();
});

// 라우터 등록
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", commentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/schedules", scheduleVoteRoutes);
app.use("/api/schedules", scheduleCommentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes); // AI 라우트 추가

// 헬스체크 엔드포인트
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

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  
  if (err.message && err.message.includes('heap')) {
    console.error('💀 메모리 부족 에러 감지');
    if (global.gc) {
      global.gc();
    }
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 처리
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 메모리 모니터링
let memoryWarningCount = 0;
const startMemoryMonitoring = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (memUsedMB > MAX_MEMORY_MB) {
      memoryWarningCount++;
      console.warn(`⚠️ 메모리 사용량 경고 #${memoryWarningCount}: ${memUsedMB}MB / ${MAX_MEMORY_MB}MB`);
      
      if (memoryWarningCount >= 3 && global.gc) {
        global.gc();
        memoryWarningCount = 0;
        console.log('🗑️ 강제 가비지 컬렉션 실행');
      }
    } else if (memoryWarningCount > 0) {
      memoryWarningCount = 0;
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 메모리 사용량:', {
        heap: `${memUsedMB}MB`,
        connections: io.engine.clientsCount
      });
    }
  }, 30000);
};

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 ${signal} 신호 수신 - 서버 종료 시작...`);
  
  try {
    server.close(() => {
      console.log('✅ HTTP 서버 종료');
    });
    
    if (chatSocketHandler && typeof chatSocketHandler.cleanup === 'function') {
      chatSocketHandler.cleanup();
    }
    
    io.close(() => {
      console.log('✅ Socket.io 서버 종료');
    });
    
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

process.on('uncaughtException', (error) => {
  console.error('💀 처리되지 않은 예외:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💀 처리되지 않은 Promise 거부:', reason);
  gracefulShutdown('unhandledRejection');
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log(`🔌 Socket.io 실행 중 - 채팅: /, 알림: /notifications`);
  console.log('📋 허용된 도메인:', allowedOrigins);
  console.log(`🧠 메모리 제한: ${MAX_MEMORY_MB}MB`);
  console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log('📊 API 엔드포인트:');
  console.log('   - GET /health (서버 상태 체크)');
  console.log('   - /api/chat/* (채팅 관련)');
  console.log('   - /api/ai/* (AI 기능)'); // AI 엔드포인트 추가
  console.log('   - /api/users/* (사용자 관련)');
  
  startMemoryMonitoring();
});
