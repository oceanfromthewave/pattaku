const postModel = require("../models/postModel");

exports.createPost = async (req, res) => {
  const { title, content } = req.body;
  const user_id = req.user.id;
  if (!title || !content) {
    return res.status(400).json({ error: "제목과 내용을 입력하세요." });
  }
  try {
    const result = await postModel.createAsync({ user_id, title, content });
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

exports.getPostById = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await postModel.getByIdAsync(id);
    if (!post) return res.status(404).json({ error: "게시글 없음" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "글 조회 실패" });
  }
};

exports.updatePost = async (req, res) => {
  const id = req.params.id;
  const { title, content } = req.body;
  try {
    await postModel.updateAsync(id, title, content);
    res.json({ message: "글 수정 성공" });
  } catch (err) {
    res.status(500).json({ error: "글 수정 실패" });
  }
};

exports.deletePost = async (req, res) => {
  const id = req.params.id;
  try {
    await postModel.deleteAsync(id);
    res.json({ message: "글 삭제 성공" });
  } catch (err) {
    res.status(500).json({ error: "글 삭제 실패" });
  }
};
