const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "아이디와 비밀번호를 입력하세요." });

  let user;
  try {
    user = await userModel.findByUsernameAsync(username);
  } catch (e) {
    console.error("DB 오류:", e);

    // 에러 타입별 처리
    if (e.code === "ECONNREFUSED" || e.code === "ETIMEDOUT") {
      return res.status(503).json({ error: "데이터베이스 연결 오류" });
    }
    if (e.code === "ER_ACCESS_DENIED_ERROR") {
      return res.status(503).json({ error: "데이터베이스 접근 권한 오류" });
    }

    return res
      .status(500)
      .json({ error: "로그인 처리 중 오류가 발생했습니다." });
  }
  if (!user)
    // 401 → 400으로 변경
    return res.status(400).json({ error: "존재하지 않는 사용자입니다." });

  let match;
  try {
    match = await bcrypt.compare(password, user.password);
  } catch (e) {
    console.error("비밀번호 검증 오류:", e);
    return res.status(500).json({ error: "인증 처리 중 오류가 발생했습니다." });
  }

  if (!match)
    // 401 → 400으로 변경
    return res.status(400).json({ error: "비밀번호가 일치하지 않습니다." });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET 환경변수 누락");
    return res.status(500).json({ error: "서버 설정 오류" });
  }

  try {
    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname },
      jwtSecret,
      { expiresIn: "2h" }
    );

    console.log(`✅ 로그인 성공: ${user.username} (ID: ${user.id})`);

    res.json({
      token,
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      profileImage: user.profile_image,
    });
  } catch (e) {
    console.error("JWT 토큰 생성 오류:", e);
    return res.status(500).json({ error: "토큰 생성 중 오류가 발생했습니다." });
  }
};
