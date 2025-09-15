// server/config/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

let dbConfig;

// DATABASE_URL이 있으면 URL 파싱, 없으면 개별 환경변수 사용
if (process.env.DATABASE_URL) {
  // URL 파싱 (mysql://user:password@host:port/database)
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    host: url.hostname,
    port: url.port,
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1), // '/' 제거
    waitForConnections: true,
    connectionLimit: 10, // 연결 풀 크기 줄임
    maxIdle: 5, // 유지할 최대 유휴 연결 수 줄임
    idleTimeout: 30000, // 유휴 타임아웃 줄임 (30초)
    queueLimit: 0,
    // acquireTimeout: 20000, // 연결 획득 타임아웃 줄임 (20초) - MySQL2에서 지원하지 않음
    // queryTimeout: 30000, // 쿼리 타임아웃 줄임 (30초) - MySQL2에서 지원하지 않음
    // autoReconnect: true, // MySQL2에서 지원하지 않음
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
    // SSL 설정 추가 (Render/PlanetScale용)
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
    // 연결 재시도 설정
    connectTimeout: 20000,
    // 추가 MySQL 설정
    timezone: "+00:00",
    charset: "utf8mb4",
  };
} else {
  // 개별 환경변수 사용
  dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 5,
    idleTimeout: 30000,
    queueLimit: 0,
    // acquireTimeout: 20000, // MySQL2에서 지원하지 않음
    // queryTimeout: 30000, // MySQL2에서 지원하지 않음
    // autoReconnect: true, // MySQL2에서 지원하지 않음
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
    connectTimeout: 20000,
    timezone: "+00:00",
    charset: "utf8mb4",
  };
}

console.log("DB 연결 설정:", {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  connectionLimit: dbConfig.connectionLimit,
  ssl: !!dbConfig.ssl,
});

// Promise 기반 풀 생성
const db = mysql.createPool(dbConfig);

// 연결 상태 모니터링
let connectionRetries = 0;
const maxRetries = 3;

// 연결 풀 이벤트 리스너 (내부 풀에 바인딩)
try {
  const underlyingPool = db.pool; // mysql2/promise 내부 Pool 접근자
  if (underlyingPool && typeof underlyingPool.on === "function") {
    underlyingPool.on("connection", (connection) => {
      console.log(`✅ DB 연결 생성됨: ${connection.threadId}`);
      connectionRetries = 0; // 성공시 재시도 카운터 리셋
    });

    underlyingPool.on("error", (err) => {
      console.error("❌ DB 연결 오류:", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ETIMEDOUT") {
        connectionRetries++;
        if (connectionRetries <= maxRetries) {
          console.log(`🔄 DB 재연결 시도 ${connectionRetries}/${maxRetries}`);
          setTimeout(() => {
            testConnection();
          }, 5000 * connectionRetries);
        } else {
          console.error("💀 DB 연결 재시도 한계 초과");
        }
      }
    });
  }
} catch (e) {
  // 이벤트 바인딩 실패는 치명적이지 않음
}

// 연결 테스트 함수
async function testConnection() {
  try {
    const result = await db.execute("SELECT 1 as test");
    console.log("✅ DB 연결 테스트 성공");
    return true;
  } catch (error) {
    console.error("❌ DB 연결 테스트 실패:", error);
    return false;
  }
}

// 앱 시작시 연결 테스트
testConnection();

// Graceful shutdown 처리
process.on("SIGINT", async () => {
  console.log("🔄 서버 종료 중... DB 연결 정리");
  try {
    await db.end();
    console.log("✅ DB 연결 풀 정리 완료");
    process.exit(0);
  } catch (error) {
    console.error("❌ DB 연결 풀 정리 오류:", error);
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  console.log("🔄 서버 종료 중... DB 연결 정리");
  try {
    await db.end();
    console.log("✅ DB 연결 풀 정리 완료");
    process.exit(0);
  } catch (error) {
    console.error("❌ DB 연결 풀 정리 오류:", error);
    process.exit(1);
  }
});

// 메모리 사용량 모니터링 (개발 환경에서만)
if (process.env.NODE_ENV !== "production") {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log("📊 메모리 사용량:", {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    });
  }, 60000); // 1분마다
}

module.exports = db;
