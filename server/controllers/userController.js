const userModel = require("../models/userModel");
const postModel = require("../models/postModel");
const commentModel = require("../models/commentModel");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const { deleteOldProfileImage } = require("../config/multerConfig");

exports.getAllUsers = async (req, res) => {
  // 관리자만 허용 예시(추후 권한체크 미들웨어에서 처리)
  // if (!req.user?.isAdmin) return res.status(403).json({ error: "권한 없음" });
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
    // 중복체크
    const [existsUsername, existsEmail, existsNickname] = await Promise.all([
      userModel.findByUsernameAsync(username),
      email ? userModel.findByEmailAsync(email) : null,
      userModel.findByNicknameAsync(nickname),
    ]);
    if (existsUsername)
      return res.status(409).json({ error: "이미 존재하는 아이디입니다." });
    if (existsEmail)
      return res.status(409).json({ error: "이미 존재하는 이메일입니다." });
    if (existsNickname)
      return res.status(409).json({ error: "이미 존재하는 닉네임입니다." });

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

// 내 프로필 조회
exports.getMyProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "로그인 필요" });
  
  try {
    const user = await userModel.findByIdAsync(userId);
    if (!user) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    
    // 비밀번호 제외하고 반환
    const { password, ...userInfo } = user;
    res.json(userInfo);
  } catch (err) {
    console.error("프로필 조회 에러:", err);
    res.status(500).json({ error: "프로필 조회 실패" });
  }
};

// 프로필 수정
exports.updateProfile = async (req, res) => {
  const userId = req.user?.id;
  const { nickname, email } = req.body;
  
  if (!userId) return res.status(401).json({ error: "로그인 필요" });
  if (!nickname) return res.status(400).json({ error: "닉네임은 필수입니다." });
  
  try {
    // 닉네임 중복 체크 (본인 제외)
    const existingUser = await userModel.findByNicknameAsync(nickname);
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: "이미 사용중인 닉네임입니다." });
    }
    
    // 이메일 중복 체크 (본인 제외)
    if (email) {
      const existingEmail = await userModel.findByEmailAsync(email);
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(409).json({ error: "이미 사용중인 이메일입니다." });
      }
    }
    
    await userModel.updateProfileAsync(userId, { nickname, email });
    res.json({ message: "프로필이 업데이트되었습니다." });
  } catch (err) {
    console.error("프로필 수정 에러:", err);
    res.status(500).json({ error: "프로필 수정 실패" });
  }
};

// 비밀번호 변경
exports.changePassword = async (req, res) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;
  
  if (!userId) return res.status(401).json({ error: "로그인 필요" });
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "현재 비밀번호와 새 비밀번호를 입력해주세요." });
  }
  
  try {
    const user = await userModel.findByIdAsync(userId);
    if (!user) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    
    // 현재 비밀번호 확인
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "현재 비밀번호가 올바르지 않습니다." });
    }
    
    // 새 비밀번호 해시화
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updatePasswordAsync(userId, hashedNewPassword);
    
    res.json({ message: "비밀번호가 변경되었습니다." });
  } catch (err) {
    console.error("비밀번호 변경 에러:", err);
    res.status(500).json({ error: "비밀번호 변경 실패" });
  }
};

// 내가 쓴 글 목록
exports.getMyPosts = async (req, res) => {
  const userId = req.user?.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (!userId) return res.status(401).json({ error: "로그인 필요" });
  
  try {
    const result = await postModel.getByUserIdAsync(userId, page, limit);
    res.json(result);
  } catch (err) {
    console.error("내 글 목록 조회 에러:", err);
    res.status(500).json({ error: "글 목록 조회 실패" });
  }
};

// 내가 쓴 댓글 목록
exports.getMyComments = async (req, res) => {
  const userId = req.user?.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (!userId) return res.status(401).json({ error: "로그인 필요" });
  
  try {
    const result = await commentModel.getByUserIdAsync(userId, page, limit);
    res.json(result);
  } catch (err) {
    console.error("내 댓글 목록 조회 에러:", err);
    res.status(500).json({ error: "댓글 목록 조회 실패" });
  }
};

// 활동 통계
exports.getMyStats = async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) return res.status(401).json({ error: "로그인 필요" });
  
  try {
    const stats = await userModel.getUserStatsAsync(userId);
    res.json(stats);
  } catch (err) {
    console.error("통계 조회 에러:", err);
    res.status(500).json({ error: "통계 조회 실패" });
  }
};

// 프로필 이미지 업로드
exports.uploadProfileImage = async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) return res.status(401).json({ error: "로그인 필요" });
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: "이미지 파일이 필요합니다." });
    }

    // 기존 프로필 이미지 삭제
    const oldImagePath = await userModel.getProfileImageAsync(userId);
    if (oldImagePath) {
      deleteOldProfileImage(oldImagePath);
    }

    // 새 이미지 경로 생성 (정적 파일 서빙을 위한 URL)
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    
    // 데이터베이스에 이미지 경로 저장
    await userModel.updateProfileImageAsync(userId, imageUrl);
    
    res.json({ 
      message: "프로필 사진이 업로드되었습니다.",
      imageUrl: imageUrl
    });
  } catch (err) {
    console.error("이미지 업로드 에러:", err);
    
    // 업로드된 파일 삭제 (에러 발생시)
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteErr) {
        console.error("임시 파일 삭제 실패:", deleteErr);
      }
    }
    
    res.status(500).json({ error: "이미지 업로드 실패" });
  }
};

// 프로필 이미지 삭제
exports.deleteProfileImage = async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) return res.status(401).json({ error: "로그인 필요" });
  
  try {
    // 현재 프로필 이미지 경로 조회
    const currentImagePath = await userModel.getProfileImageAsync(userId);
    
    if (!currentImagePath) {
      return res.status(400).json({ error: "삭제할 프로필 사진이 없습니다." });
    }
    
    // 데이터베이스에서 이미지 경로 삭제
    await userModel.deleteProfileImageAsync(userId);
    
    // 실제 파일 삭제
    deleteOldProfileImage(currentImagePath);
    
    res.json({ message: "프로필 사진이 삭제되었습니다." });
  } catch (err) {
    console.error("이미지 삭제 에러:", err);
    res.status(500).json({ error: "이미지 삭제 실패" });
  }
};
