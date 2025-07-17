const express = require("express");
const cors = require("cors");
require("dotenv").config();

// 라우트 파일 불러오기
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/comments"); // 게시판(포스트) 댓글
const scheduleRoutes = require("./routes/schedule"); // 일정 CRUD
const scheduleVoteRoutes = require("./routes/scheduleVote"); // 일정 투표
const scheduleCommentRoutes = require("./routes/scheduleComment"); // 일정 댓글

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 라우트 등록 (순서는 무관, 중복경로 없어야 됨)
app.use("/api/users", userRoutes); // 회원가입, 유저조회 등
app.use("/api/posts", postRoutes); // 게시판 글 CRUD
app.use("/api/auth", authRoutes); // 로그인 등 인증
app.use("/api", commentRoutes); // 게시판(포스트) 댓글: /api/posts/:postId/comments 등

app.use("/api/schedules", scheduleRoutes); // 일정 CRUD: /api/schedules/:id
app.use("/api/schedules", scheduleVoteRoutes); // 일정 투표: /api/schedules/:id/votes, /api/schedules/:id/vote
app.use("/api/schedules", scheduleCommentRoutes); // 일정 댓글: /api/schedules/:id/comments

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
