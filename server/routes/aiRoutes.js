// routes/aiRoutes.js - AI 기능 API 라우터
const express = require("express");
const router = express.Router();
const aiService = require("../services/aiService");
const auth = require("../middleware/authMiddleware");

// 모든 AI 라우트에 인증 필요
router.use(auth);

// 게시글 자동 요약
router.post("/summarize", async (req, res) => {
  try {
    const { content } = req.body; 

    if (!content || content.length < 100) {
      return res.status(400).json({
        success: false,
        message: "요약할 내용이 너무 짧습니다. (최소 100자)",
      });
    }

    const summary = await aiService.generatePostSummary(content, req.user.id);

    res.json({
      success: true,
      summary,
      usage: aiService.getUsageStats(req.user.id),
    });
  } catch (error) {
    console.error("요약 API 오류:", error);
    res.status(429).json({
      success: false,
      message: error.message,
    });
  }
});

// 감정 분석
router.post("/sentiment", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.length < 10) {
      return res.status(400).json({
        success: false,
        message: "분석할 텍스트가 너무 짧습니다.",
      });
    }

    const analysis = await aiService.analyzeSentiment(text, req.user.id);

    res.json({
      success: true,
      analysis,
      usage: aiService.getUsageStats(req.user.id),
    });
  } catch (error) {
    console.error("감정 분석 API 오류:", error);
    res.status(429).json({
      success: false,
      message: error.message,
    });
  }
});

// 스팸 감지
router.post("/spam-check", async (req, res) => {
  try {
    const { content } = req.body;

    const result = await aiService.detectSpam(content, req.user.id);

    res.json({
      success: true,
      result,
      usage: aiService.getUsageStats(req.user.id),
    });
  } catch (error) {
    console.error("스팸 감지 API 오류:", error);
    res.status(500).json({
      success: false,
      message: "스팸 감지 중 오류가 발생했습니다.",
    });
  }
});

// 태그 추천
router.post("/suggest-tags", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title && !content) {
      return res.status(400).json({
        success: false,
        message: "제목 또는 내용이 필요합니다.",
      });
    }

    const suggestions = await aiService.suggestTags(
      title || "",
      content || "",
      req.user.id
    );

    res.json({
      success: true,
      suggestions,
      usage: aiService.getUsageStats(req.user.id),
    });
  } catch (error) {
    console.error("태그 추천 API 오류:", error);
    res.status(429).json({
      success: false,
      message: error.message,
    });
  }
});

// 사용량 조회
router.get("/usage", async (req, res) => {
  try {
    const usage = aiService.getUsageStats(req.user.id);

    res.json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error("사용량 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "사용량 조회 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;
