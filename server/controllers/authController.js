const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "아이디와 비밀번호를 입력하세요." });
  }
  try {
    const user = await userModel.findByUsernameAsync(username);
    if (!user)
      return res.status(401).json({ error: "존재하지 않는 사용자입니다." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });

    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname },
      process.env.JWT_SECRET || "my_jwt_secret",
      { expiresIn: "2h" }
    );
    res.json({ token, username: user.username, nickname: user.nickname });
  } catch (err) {
    console.error("로그인 에러:", err);
    res.status(500).json({ error: "서버 오류" });
  }
};
