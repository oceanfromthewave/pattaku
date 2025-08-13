-- 패타쿠 프로젝트 성능 최적화 SQL
-- 실행 순서대로 배치하여 성능을 극대화합니다.

-- =========================================
-- 1. 필수 인덱스 추가 (High Priority)
-- =========================================

-- 게시글 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_title_content ON posts(title, content(255));

-- 좋아요/싫어요 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id_type ON post_likes(post_id, type);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);

-- 댓글 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON comments(post_id, created_at DESC);

-- 파일 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_post_files_post_id ON post_files(post_id);

-- 사용자 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- =========================================
-- 2. 성능용 컬럼 추가 (Medium Priority)
-- =========================================

-- posts 테이블에 캐시 컬럼 추가
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislike_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS file_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- 기존 데이터 업데이트
UPDATE posts p SET 
  like_count = COALESCE((
    SELECT SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) 
    FROM post_likes pl WHERE pl.post_id = p.id
  ), 0),
  dislike_count = COALESCE((
    SELECT SUM(CASE WHEN type = 'dislike' THEN 1 ELSE 0 END) 
    FROM post_likes pl WHERE pl.post_id = p.id
  ), 0),
  comment_count = COALESCE((
    SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id
  ), 0),
  file_count = COALESCE((
    SELECT COUNT(*) FROM post_files pf WHERE pf.post_id = p.id
  ), 0);

-- =========================================
-- 3. 실시간 업데이트 트리거 생성
-- =========================================

-- 좋아요/싫어요 트리거
DELIMITER //

CREATE TRIGGER IF NOT EXISTS trigger_post_likes_insert
AFTER INSERT ON post_likes
FOR EACH ROW
BEGIN
  UPDATE posts SET 
    like_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = NEW.post_id AND type = 'like'),
    dislike_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = NEW.post_id AND type = 'dislike')
  WHERE id = NEW.post_id;
END//

CREATE TRIGGER IF NOT EXISTS trigger_post_likes_delete
AFTER DELETE ON post_likes
FOR EACH ROW
BEGIN
  UPDATE posts SET 
    like_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = OLD.post_id AND type = 'like'),
    dislike_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = OLD.post_id AND type = 'dislike')
  WHERE id = OLD.post_id;
END//

-- 댓글 수 업데이트 트리거
CREATE TRIGGER IF NOT EXISTS trigger_comments_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
END//

CREATE TRIGGER IF NOT EXISTS trigger_comments_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
  UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
END//

-- 파일 수 업데이트 트리거
CREATE TRIGGER IF NOT EXISTS trigger_post_files_insert
AFTER INSERT ON post_files
FOR EACH ROW
BEGIN
  UPDATE posts SET file_count = file_count + 1 WHERE id = NEW.post_id;
END//

CREATE TRIGGER IF NOT EXISTS trigger_post_files_delete
AFTER DELETE ON post_files
FOR EACH ROW
BEGIN
  UPDATE posts SET file_count = file_count - 1 WHERE id = OLD.post_id;
END//

DELIMITER ;

-- =========================================
-- 4. 채팅 성능 최적화
-- =========================================

-- 채팅 메시지 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id_created_at ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);

-- 채팅방 참여자 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);

-- =========================================
-- 5. 스케줄 성능 최적화
-- =========================================

-- 스케줄 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_schedules_user_id_created_at ON schedules(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_votes_schedule_id ON schedule_votes(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_comments_schedule_id ON schedule_comments(schedule_id);

-- =========================================
-- 6. 알림 성능 최적화
-- =========================================

-- 알림 관련 인덱스 (테이블이 존재하는 경우)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =========================================
-- 7. 데이터베이스 설정 최적화
-- =========================================

-- MySQL 성능 최적화 설정 (my.cnf에 추가 권장)
/*
[mysqld]
innodb_buffer_pool_size = 128M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2
query_cache_size = 16M
query_cache_type = 1
max_connections = 100
*/

-- =========================================
-- 8. 분석 쿼리 (성능 확인용)
-- =========================================

-- 인덱스 사용률 확인
SELECT 
  table_name,
  index_name,
  seq_in_index,
  column_name,
  cardinality
FROM information_schema.statistics 
WHERE table_schema = DATABASE()
ORDER BY table_name, index_name, seq_in_index;

-- 테이블 크기 확인
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = DATABASE()
ORDER BY (data_length + index_length) DESC;

-- =========================================
-- 실행 완료 확인
-- =========================================
SELECT 'Performance optimization completed successfully' AS status;