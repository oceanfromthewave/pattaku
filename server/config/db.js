// server/config/db.js
const mysql = require("mysql2"); // 여기 반드시 mysql2!
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
    connectionLimit: 10,
    queueLimit: 0,
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
    queueLimit: 0,
  };
}

console.log('DB 연결 설정:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

const db = mysql.createPool(dbConfig);

module.exports = db.promise(); // 반드시 promise()로 내보내기!
