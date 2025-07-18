// server/config/db.js
const mysql = require("mysql2"); // 여기 반드시 mysql2!
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = db.promise(); // 반드시 promise()로 내보내기!
