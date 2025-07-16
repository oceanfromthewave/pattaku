const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/comments");
const scheduleRoutes = require("./routes/schedule");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api", commentRoutes);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
