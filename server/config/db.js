// server/config/db.js
const mysql = require("mysql2");
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
    connectionLimit: 20,
    maxIdle: 20,
    idleTimeout: 60000,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
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
    connectionLimit: 20,
    maxIdle: 20,
    idleTimeout: 60000,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
  };
}

console.log('DB 연결 설정:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

const db = mysql.createPool(dbConfig);

// 연결 풀 이벤트 리스너
db.on('connection', (connection) => {
  console.log('DB 연결 생성됨:', connection.threadId);
});

db.on('error', (err) => {
  console.error('DB 연결 오류:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('DB 연결이 끊어졌습니다. 재연결을 시도합니다.');
  }
});

module.exports = db.promise(); // 반드시 promise()로 내보내기!