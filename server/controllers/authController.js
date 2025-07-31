const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
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
    return res.status(500).json({ error: "DB 오류" });
  }
  if (!user)
    return res.status(401).json({ error: "존재하지 않는 사용자입니다." });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET 환경변수 누락");
    return res.status(500).json({ error: "서버 설정 오류" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, nickname: user.nickname },
    jwtSecret,
    { expiresIn: "2h" }
  );
  // id 포함하여 반환
  res.json({
    token,
    userId: user.id,
    username: user.username,
    nickname: user.nickname,
    profileImage: user.profile_image, // 프로필 이미지 추가
  });
};
