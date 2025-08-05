-- 데이터베이스 스키마 업데이트 스크립트
-- users 테이블에 profile_image 컬럼 추가

-- 1. users 테이블 구조 확인
DESCRIBE users;

-- 2. profile_image 컬럼이 없는 경우 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL 
COMMENT '프로필 이미지 URL';

-- 3. profileImage 컬럼이 있는 경우 profile_image로 이름 변경
-- (컬럼이 존재하는지 먼저 확인)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'profileImage'
);

-- profileImage 컬럼이 있으면 profile_image로 이름 변경
SET @sql = IF(@col_exists > 0, 
    'ALTER TABLE users CHANGE profileImage profile_image VARCHAR(255) DEFAULT NULL',
    'SELECT "profileImage 컬럼이 존재하지 않음" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 최종 테이블 구조 확인
DESCRIBE users;