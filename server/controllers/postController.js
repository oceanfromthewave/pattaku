const postModel = require("../models/postModel");
const fs = require("fs");
const path = require("path");
const NotificationService = require("../notificationService");
const cache = require("../utils/cache");

let notificationService;

// 미들웨어에서 req.app.get('socketHandler')를 통해 socketHandler를 주입받아 NotificationService 인스턴스 생성
exports.initNotificationService = (req, res, next) => {
  if (!notificationService) {
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      notificationService = new NotificationService(socketHandler);
    } else {
      console.warn("SocketHandler not found on app. NotificationService will not send real-time notifications.");
    }
  }
  next();
};

exports.createPost = async (req, res) => {
  const { title, content } = req.body;
  const user_id = req.user.id;
  
  console.log(`📝 게시글 작성 요청: 사용자 ${user_id}, 제목: "${title}"`);
  
  if (!title || !content) {
    return res.status(400).json({ error: "제목과 내용을 입력하세요." });
  }

  try {
    const result = await postModel.createAsync({ user_id, title, content });
    if (req.files && req.files.length > 0) {
      await postModel.addFilesAsync(result.insertId, req.files);
      console.log(`📎 파일 ${req.files.length}개 첨부됨`);
    }
    
    console.log(`✅ 게시글 작성 성공: ID ${result.insertId}`);
    res.status(201).json({ message: "글 작성 성공", postId: result.insertId });
  } catch (err) {
    console.error('❌ 게시글 작성 실패:', err);
    
    // 에러 타입별 처리
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: "잘못된 사용자 정보입니다." });
    }
    if (err.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ error: "내용이 너무 깁니다." });
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ error: "데이터베이스 연결 오류" });
    }
    
    res.status(500).json({ error: "글 작성 중 오류가 발생했습니다." });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { q: keyword, author, sort } = req.query;

    console.log(`📋 게시글 목록 조회: 페이지 ${page}, 검색어: "${keyword || '없음'}"`);

    // 캐시 키 생성
    const cacheKey = `posts:${page}:${limit}:${keyword || 'none'}:${author || 'none'}:${sort || 'recent'}`;
    
    // 캐시에서 확인 (검색이나 필터링이 없는 경우만)
    if (!keyword && !author && page <= 5) { // 첫 5페이지만 캐싱
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`🚀 캐시에서 반환: ${cacheKey}`);
        return res.json(cached);
      }
    }

    // 검색 조건 구성
    let whereClause = "WHERE 1=1";
    let queryParams = [];
    
    if (keyword) {
      whereClause += " AND (p.title LIKE ? OR p.content LIKE ?)";
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (author) {
      whereClause += " AND (u.username LIKE ? OR u.nickname LIKE ?)";
      queryParams.push(`%${author}%`, `%${author}%`);
    }

    // 정렬 조건 (최적화된 컬럼 사용)
    let orderClause = "ORDER BY p.created_at DESC";
    if (sort === 'popular') {
      orderClause = "ORDER BY p.like_count DESC, p.created_at DESC";
    } else if (sort === 'comments') {
      orderClause = "ORDER BY p.comment_count DESC, p.created_at DESC";
    } else if (sort === 'views') {
      orderClause = "ORDER BY p.view_count DESC, p.created_at DESC";
    }

    // 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
    `;
    const countResult = await postModel.getAllWithPaginationAsync(countQuery, queryParams);
    const total = countResult[0].total;

    // 최적화된 게시글 목록 조회 (비정규화된 컬럼 사용)
    const postsQuery = `
      SELECT 
        p.*,
        u.username as author,
        u.nickname as author_nickname,
        p.like_count as likes,
        p.dislike_count as dislikes,
        p.comment_count as comments_count,
        p.file_count as files_count,
        p.view_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    
    const posts = await postModel.getAllWithPaginationAsync(
      postsQuery, 
      [...queryParams, limit, offset]
    );
    
    const totalPages = Math.ceil(total / limit);
    
    const result = {
      posts,
      currentPage: page,
      totalPages,
      total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
    
    // 캐시에 저장 (검색이나 필터링이 없는 경우만)
    if (!keyword && !author && page <= 5) {
      cache.set(cacheKey, result, 180000); // 3분 TTL
      console.log(`💾 캐시에 저장: ${cacheKey}`);
    }
    
    console.log(`✅ 게시글 목록 조회 성공: ${posts.length}개`);
    
    res.json(result);
  } catch (err) {
    console.error('❌ 게시글 목록 조회 실패:', err);
    
    // 에러 타입별 처리
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ error: "데이터베이스 연결 오류" });
    }
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({ error: "잘못된 정렬 조건입니다." });
    }
    
    res.status(500).json({ error: "게시글 목록을 불러올 수 없습니다." });
  }
};

// 게시글 상세 조회 (좋아요/싫어요 상태 포함)
exports.getPostById = async (req, res) => {
  const id = req.params.id;
  const userId = req.user?.id; // 로그인하지 않은 경우 undefined
  
  console.log(`📖 게시글 상세 조회: ID ${id}, 사용자 ${userId || '비로그인'}`);
  
  try {
    const post = await postModel.getByIdAsync(id);
    if (!post) {
      console.log(`❌ 게시글 없음: ID ${id}`);
      return res.status(404).json({ error: "게시글 없음" });
    }
    
    // 조회수 증가
    await postModel.incrementViewsAsync(id);
    
    // 파일 정보 조회
    const files = await postModel.getFilesAsync(id);
    post.files = files.map((f) => ({
      url: `/uploads/${f.filename}`,
      name: f.originalname,
    }));
    post.authorId = post.user_id;

    // 좋아요/싫어요 정보 조회 (사용자 상태 포함)
    const likeInfo = await postModel.getPostLikeInfo(id, userId);
    post.likes = likeInfo.likes;
    post.dislikes = likeInfo.dislikes;
    post.isLiked = likeInfo.liked;
    post.isDisliked = likeInfo.disliked;

    console.log(`✅ 게시글 조회 성공: "${post.title}" (좋아요: ${post.likes}, 싫어요: ${post.dislikes})`);
    res.json(post);
  } catch (err) {
    console.error('❌ 게시글 조회 실패:', err);
    res.status(500).json({ error: "글 조회 실패" });
  }
};

exports.updatePost = async (req, res) => {
  const id = req.params.id;
  let { title, content, remain_files } = req.body;
  const user_id = req.user.id;

  console.log(`✏️ 게시글 수정 요청: ID ${id}, 사용자 ${user_id}`);

  // remain_files는 JSON.stringfy로 옴 (파일명 배열)
  let remainFiles = [];
  if (typeof remain_files === "string") {
    try {
      remainFiles = JSON.parse(remain_files);
    } catch {
      remainFiles = [];
    }
  } else if (Array.isArray(remain_files)) {
    remainFiles = remain_files;
  }

  try {
    const post = await postModel.getByIdAsync(id);
    if (!post) {
      return res.status(404).json({ error: "게시글 없음" });
    }
    if (post.user_id !== user_id) {
      return res.status(403).json({ error: "수정 권한 없음" });
    }

    if (!title || !content) {
      return res.status(400).json({ error: "제목/내용 필요" });
    }

    // 게시글 텍스트 수정
    await postModel.updateAsync(id, title, content);

    // 기존 파일 처리 (유지하는 파일 제외 모두 삭제)
    const existFiles = await postModel.getFilesAsync(id);
    for (const f of existFiles) {
      if (!remainFiles.includes(f.originalname)) {
        await postModel.deleteFileAsync(id, f.filename);
        const filePath = path.join(__dirname, "../uploads", f.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    // 새 파일 추가
    if (req.files && req.files.length > 0) {
      await postModel.addFilesAsync(id, req.files);
      console.log(`📎 새 파일 ${req.files.length}개 추가됨`);
    }

    console.log(`✅ 게시글 수정 성공: ID ${id}`);
    res.json({ message: "글 수정 성공" });
  } catch (err) {
    console.error('❌ 게시글 수정 실패:', err);
    res.status(500).json({ error: "글 수정 실패" });
  }
};

exports.deletePost = async (req, res) => {
  const id = req.params.id;
  const user_id = req.user.id;
  
  console.log(`🗑️ 게시글 삭제 요청: ID ${id}, 사용자 ${user_id}`);
  
  try {
    const post = await postModel.getByIdAsync(id);
    if (!post) {
      return res.status(404).json({ error: "게시글 없음" });
    }
    if (post.user_id !== user_id) {
      return res.status(403).json({ error: "삭제 권한 없음" });
    }

    await postModel.deleteAsync(id);
    console.log(`✅ 게시글 삭제 성공: ID ${id}`);
    res.json({ message: "글 삭제 성공" });
  } catch (err) {
    console.error('❌ 게시글 삭제 실패:', err);
    res.status(500).json({ error: "글 삭제 실패" });
  }
};

exports.likePost = async (req, res) => {
  const user_id = req.user.id;
  const post_id = req.params.id;

  console.log(`👍 좋아요 요청: 게시글 ${post_id}, 사용자 ${user_id}`);

  try {
    // 현재 좋아요/싫어요 상태 확인
    const existedLike = await postModel.checkPostLike(post_id, user_id, "like");
    const existedDislike = await postModel.checkPostLike(post_id, user_id, "dislike");

    if (existedLike) {
      // 이미 좋아요 → 취소
      await postModel.deletePostLike(post_id, user_id, "like");
      console.log(`✅ 좋아요 취소: 게시글 ${post_id}`);
    } else {
      // 좋아요 추가
      await postModel.addPostLike(post_id, user_id, "like");
      console.log(`✅ 좋아요 추가: 게시글 ${post_id}`);
      
      // 동시에 싫어요가 있었다면 해제
      if (existedDislike) {
        await postModel.deletePostLike(post_id, user_id, "dislike");
        console.log(`ℹ️ 기존 싫어요 해제: 게시글 ${post_id}`);
      }

      // 게시글 소유자에게 알림 전송
      if (notificationService) {
        try {
          const post = await postModel.getByIdAsync(post_id);
          if (post && post.user_id !== user_id) {
            await notificationService.createLikeNotification(
              post.user_id, 
              user_id, 
              post_id, 
              null,
              'post', 
              post.title, 
              req.user?.nickname || "익명"
            );
          }
        } catch (notifError) {
          console.error('알림 전송 실패:', notifError);
        }
      }
    }

    // 최신 상태 조회
    const likeInfo = await postModel.getPostLikeInfo(post_id, user_id);
    
    console.log(`📊 최종 상태: 좋아요 ${likeInfo.likes}, 싫어요 ${likeInfo.dislikes}`);
    res.json(likeInfo);
  } catch (err) {
    console.error('❌ 좋아요 처리 실패:', err);
    res.status(500).json({ error: "추천 처리 실패" });
  }
};

exports.dislikePost = async (req, res) => {
  const user_id = req.user.id;
  const post_id = req.params.id;

  console.log(`👎 싫어요 요청: 게시글 ${post_id}, 사용자 ${user_id}`);

  try {
    // 현재 좋아요/싫어요 상태 확인
    const existedDislike = await postModel.checkPostLike(post_id, user_id, "dislike");
    const existedLike = await postModel.checkPostLike(post_id, user_id, "like");

    if (existedDislike) {
      // 이미 싫어요 → 취소
      await postModel.deletePostLike(post_id, user_id, "dislike");
      console.log(`✅ 싫어요 취소: 게시글 ${post_id}`);
    } else {
      // 싫어요 추가
      await postModel.addPostLike(post_id, user_id, "dislike");
      console.log(`✅ 싫어요 추가: 게시글 ${post_id}`);
      
      // 동시에 좋아요가 있었다면 해제
      if (existedLike) {
        await postModel.deletePostLike(post_id, user_id, "like");
        console.log(`ℹ️ 기존 좋아요 해제: 게시글 ${post_id}`);
      }
    }

    // 최신 상태 조회
    const likeInfo = await postModel.getPostLikeInfo(post_id, user_id);
    
    console.log(`📊 최종 상태: 좋아요 ${likeInfo.likes}, 싫어요 ${likeInfo.dislikes}`);
    res.json(likeInfo);
  } catch (err) {
    console.error('❌ 싫어요 처리 실패:', err);
    res.status(500).json({ error: "싫어요 처리 실패" });
  }
};