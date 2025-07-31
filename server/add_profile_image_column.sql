-- users 테이블에 profile_image 컬럼 추가
-- 프로필 이미지 경로를 저장하는 컬럼

ALTER TABLE users 
ADD COLUMN profile_image VARCHAR(255) NULL 
COMMENT '프로필 이미지 파일 경로' 
AFTER nickname;

-- 추가된 컬럼에 인덱스 생성 (선택사항)
ALTER TABLE users ADD INDEX idx_profile_image (profile_image);

SELECT 'profile_image column added successfully!' as status;
