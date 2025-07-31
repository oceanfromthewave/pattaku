const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 폴더 확인 및 생성
const ensureUploadDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 프로필 이미지 업로드 설정
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    ensureUploadDirectory(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 고유한 파일명 생성: userId_timestamp_originalname
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `profile_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// 파일 필터링 (이미지만 허용)
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원되지 않는 파일 형식입니다. JPG, PNG, GIF 파일만 업로드 가능합니다.'), false);
  }
};

// 프로필 이미지 업로드 미들웨어
const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
    files: 1 // 한 번에 하나의 파일만
  }
});

// 기존 프로필 이미지 삭제 함수
const deleteOldProfileImage = (imagePath) => {
  if (imagePath) {
    const fullPath = path.join(__dirname, '../uploads/profiles', path.basename(imagePath));
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        console.log('기존 프로필 이미지 삭제됨:', fullPath);
      } catch (error) {
        console.error('기존 프로필 이미지 삭제 실패:', error);
      }
    }
  }
};

module.exports = {
  uploadProfileImage,
  deleteOldProfileImage
};
