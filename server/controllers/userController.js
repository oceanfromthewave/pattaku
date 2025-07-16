const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllAsync();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "사용자 조회 실패" });
  }
};

exports.registerUser = async (req, res) => {
  const { username, password, email, nickname } = req.body;
  if (!username || !password || !nickname) {
    return res.status(400).json({ error: "필수 입력값이 없습니다." });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await userModel.createAsync({ username, password: hash, email, nickname });
    res.status(201).json({ message: "회원가입 성공" });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "이미 존재하는 아이디/이메일/닉네임입니다." });
    }
    res.status(500).json({ error: "회원가입 실패", details: e.message });
  }
};
