const postModel = require("../models/postModel");
const fs = require("fs");
const path = require("path");

exports.createPost = async (req, res) => {
  const { title, content } = req.body;
  const user_id = req.user.id;
  if (!title || !content)
    return res.status(400).json({ error: "제목과 내용을 입력하세요." });

  try {
    const result = await postModel.createAsync({ user_id, title, content });
    if (req.files && req.files.length > 0) {
      await postModel.addFilesAsync(result.insertId, req.files);
    }
    res.status(201).json({ message: "글 작성 성공", postId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "글 작성 실패" });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await postModel.getAllAsync();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "글 목록 조회 실패" });
  }
};

// 게시글에서 추천/싫어요 카운트 가져오기
exports.getPostById = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await postModel.getByIdAsync(id);
    if (!post) return res.status(404).json({ error: "게시글 없음" });
    const files = await postModel.getFilesAsync(id);
    post.files = files.map((f) => ({
      url: `/uploads/${f.filename}`,
      name: f.originalname,
    }));
    post.authorId = post.user_id;

    // 추가: 좋아요/싫어요 개수
    post.likes = await postModel.getLikeCount(id, "like");
    post.dislikes = await postModel.getLikeCount(id, "dislike");

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "글 조회 실패" });
  }
};

exports.updatePost = async (req, res) => {
  const id = req.params.id;
  let { title, content, remain_files } = req.body;
  const user_id = req.user.id;

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

  const post = await postModel.getByIdAsync(id);
  if (!post) return res.status(404).json({ error: "게시글 없음" });
  if (post.user_id !== user_id)
    return res.status(403).json({ error: "수정 권한 없음" });

  if (!title || !content)
    return res.status(400).json({ error: "제목/내용 필요" });

  try {
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
    }

    res.json({ message: "글 수정 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "글 수정 실패" });
  }
};

exports.deletePost = async (req, res) => {
  const id = req.params.id;
  const user_id = req.user.id;
  const post = await postModel.getByIdAsync(id);
  if (!post) return res.status(404).json({ error: "게시글 없음" });
  if (post.user_id !== user_id)
    return res.status(403).json({ error: "삭제 권한 없음" });

  try {
    await postModel.deleteAsync(id);
    res.json({ message: "글 삭제 성공" });
  } catch (err) {
    res.status(500).json({ error: "글 삭제 실패" });
  }
};

exports.likePost = async (req, res) => {
  const user_id = req.user.id;
  const post_id = req.params.id;

  try {
    // 현재 좋아요 상태 확인
    const existedLike = await postModel.checkPostLike(post_id, user_id, "like");
    // 싫어요가 이미 눌린 상태라면 해제
    const existedDislike = await postModel.checkPostLike(
      post_id,
      user_id,
      "dislike"
    );

    if (existedLike) {
      // 이미 좋아요 → 취소
      await postModel.deletePostLike(post_id, user_id, "like");
    } else {
      // 좋아요 추가
      await postModel.addPostLike(post_id, user_id, "like");
      // 동시에 싫어요가 있었다면 해제
      if (existedDislike) {
        await postModel.deletePostLike(post_id, user_id, "dislike");
      }
    }

    // 최신 상태 집계
    const likes = await postModel.getLikeCount(post_id, "like");
    const dislikes = await postModel.getLikeCount(post_id, "dislike");
    const liked = await postModel.checkPostLike(post_id, user_id, "like");
    const disliked = await postModel.checkPostLike(post_id, user_id, "dislike");
    res.json({ liked, disliked, likes, dislikes });
  } catch (err) {
    res.status(500).json({ error: "추천 처리 실패" });
  }
};

// ★ 싫어요
exports.dislikePost = async (req, res) => {
  const user_id = req.user.id;
  const post_id = req.params.id;

  try {
    const existedDislike = await postModel.checkPostLike(
      post_id,
      user_id,
      "dislike"
    );
    const existedLike = await postModel.checkPostLike(post_id, user_id, "like");

    if (existedDislike) {
      // 이미 싫어요 → 취소
      await postModel.deletePostLike(post_id, user_id, "dislike");
    } else {
      // 싫어요 추가
      await postModel.addPostLike(post_id, user_id, "dislike");
      // 동시에 좋아요가 있었다면 해제
      if (existedLike) {
        await postModel.deletePostLike(post_id, user_id, "like");
      }
    }

    // 최신 상태 집계
    const likes = await postModel.getLikeCount(post_id, "like");
    const dislikes = await postModel.getLikeCount(post_id, "dislike");
    const liked = await postModel.checkPostLike(post_id, user_id, "like");
    const disliked = await postModel.checkPostLike(post_id, user_id, "dislike");
    res.json({ liked, disliked, likes, dislikes });
  } catch (err) {
    res.status(500).json({ error: "싫어요 처리 실패" });
  }
};
