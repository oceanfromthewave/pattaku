// server/services/aiService.js - AI 서비스 통합 (Gemini API 연동)
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");
require("dotenv").config();

class AIService {
  constructor() {
    this.rateLimits = new Map(); // 사용자별 요청 제한
    this.cache = new Map(); // 결과 캐싱
    
    // Gemini API 초기화
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("✅ Gemini AI 서비스가 초기화되었습니다.");
    } else {
      console.warn("⚠️ GEMINI_API_KEY가 설정되지 않았습니다. Mock 모드로 동작합니다.");
    }
  }

  // 요청 제한 확인
  checkRateLimit(userId, service) {
    const key = `${userId}-${service}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);
    
    if (!limit) {
      this.rateLimits.set(key, { count: 1, resetTime: now + 3600000 }); // 1시간
      return true;
    }
    
    if (now > limit.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + 3600000 });
      return true;
    }
    
    const maxRequests = {
      'summary': 20,
      'sentiment': 30,
      'spam': 100,
      'tags': 30,
    };
    
    if (limit.count >= (maxRequests[service] || 20)) {
      return false;
    }
    
    limit.count++;
    return true;
  }

  // 캐시 확인
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 3600000 * 24) { // 24시간 캐시
      return cached.data;
    }
    return null;
  }

  // 캐시 저장
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // 캐시 크기 관리 (최대 1000개)
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  // Gemini 실행 공통 함수
  async runGemini(prompt) {
    if (!this.genAI) return null;
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API 호출 오류:", error);
      return null;
    }
  }

  // 게시글 자동 요약
  async generatePostSummary(content, userId) {
    if (!this.checkRateLimit(userId, 'summary')) {
      throw new Error('요약 기능 사용 한도를 초과했습니다. 1시간 후 다시 시도해주세요.');
    }

    const cacheKey = `summary-${this.generateHash(content)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Gemini API 사용 시도
    if (this.genAI) {
      const prompt = `다음 커뮤니티 게시글 내용을 3문장 이내로 요약해줘. 한국어로 작성해줘.\n\n내용: ${content}`;
      const summary = await this.runGemini(prompt);
      if (summary) {
        const cleanedSummary = summary.trim();
        this.setCache(cacheKey, cleanedSummary);
        return cleanedSummary;
      }
    }

    // 폴백: 간단한 추출 요약 알고리즘
    try {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const summary = sentences.slice(0, Math.min(3, sentences.length)).join('. ') + '.';
      
      this.setCache(cacheKey, summary);
      return summary;
    } catch (error) {
      console.error('요약 생성 오류:', error);
      throw new Error('요약 생성 중 오류가 발생했습니다.');
    }
  }

  // 감정 분석
  async analyzeSentiment(text, userId) {
    if (!this.checkRateLimit(userId, 'sentiment')) {
      throw new Error('감정 분석 기능 사용 한도를 초과했습니다.');
    }

    const cacheKey = `sentiment-${this.generateHash(text)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (this.genAI) {
      const prompt = `다음 텍스트의 감정을 분석해서 JSON 형식으로만 응답해줘. 
      형식: {"sentiment": "positive"|"negative"|"neutral", "confidence": 0.0~1.0, "explanation": "이유"}
      텍스트: ${text}`;
      
      const response = await this.runGemini(prompt);
      if (response) {
        try {
          // JSON 추출 (Markdown backticks 제거)
          const jsonMatch = response.match(/\{.*\}/s);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            this.setCache(cacheKey, result);
            return result;
          }
        } catch (e) {
          console.error("JSON 파싱 오류:", e);
        }
      }
    }

    // 폴백: 키워드 기반 분석
    try {
      const positiveWords = ['좋', '훌륭', '멋지', '완벽', '최고', '행복', '기쁘', '만족'];
      const negativeWords = ['나쁘', '싫', '최악', '화나', '슬프', '실망', '짜증', '불만'];
      
      let positiveScore = 0;
      let negativeScore = 0;
      
      positiveWords.forEach(word => {
        const matches = text.match(new RegExp(word, 'gi'));
        if (matches) positiveScore += matches.length;
      });
      
      negativeWords.forEach(word => {
        const matches = text.match(new RegExp(word, 'gi'));
        if (matches) negativeScore += matches.length;
      });
      
      let sentiment = 'neutral';
      let confidence = 0.5;
      
      if (positiveScore > negativeScore) {
        sentiment = 'positive';
        confidence = Math.min(0.9, 0.5 + (positiveScore - negativeScore) * 0.1);
      } else if (negativeScore > positiveScore) {
        sentiment = 'negative';
        confidence = Math.min(0.9, 0.5 + (negativeScore - positiveScore) * 0.1);
      }

      const result = {
        sentiment,
        confidence,
        explanation: `키워드 기반 분석 (긍정: ${positiveScore}, 부정: ${negativeScore})`
      };
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { sentiment: 'neutral', confidence: 0.5, explanation: '분석 실패' };
    }
  }

  // 스팸 필터링
  async detectSpam(content, userId) {
    if (!this.checkRateLimit(userId, 'spam')) {
      return { isSpam: false, confidence: 0, reason: '요청 한도 초과' };
    }

    const cacheKey = `spam-${this.generateHash(content)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (this.genAI) {
      const prompt = `다음 게시글이 스팸(광고, 도배, 부적절한 홍보)인지 판별해서 JSON으로 응답해줘.
      형식: {"isSpam": true|false, "confidence": 0.0~1.0, "reason": "이유"}
      내용: ${content}`;
      
      const response = await this.runGemini(prompt);
      if (response) {
        try {
          const jsonMatch = response.match(/\{.*\}/s);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            this.setCache(cacheKey, result);
            return result;
          }
        } catch (e) {}
      }
    }

    // 폴백 logic
    const spamPatterns = [/\b(?:무료|공짜|100%|확실|보장)\b/gi, /(?:http|www)\./gi];
    let isSpam = spamPatterns.some(p => p.test(content));
    return { isSpam, confidence: isSpam ? 0.8 : 0.2, reason: isSpam ? "패턴 기반 감지" : "정상" };
  }

  // 자동 태그 추천
  async suggestTags(title, content, userId) {
    if (!this.checkRateLimit(userId, 'tags')) {
      throw new Error('태그 추천 기능 사용 한도를 초과했습니다.');
    }

    const cacheKey = `tags-${this.generateHash(title + content)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (this.genAI) {
      const prompt = `다음 게시글 제목과 내용에 어울리는 해시태그 5개를 추천해줘. JSON 배열로 응답해줘.
      형식: {"tags": ["태그1", "태그2", ...]}
      제목: ${title}
      내용: ${content}`;
      
      const response = await this.runGemini(prompt);
      if (response) {
        try {
          const jsonMatch = response.match(/\{.*\}/s);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            this.setCache(cacheKey, result.tags);
            return result.tags;
          }
        } catch (e) {}
      }
    }

    return ["커뮤니티", "게시글"];
  }

  generateHash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  getUsageStats(userId) {
    const stats = {};
    for (const [key, limit] of this.rateLimits.entries()) {
      if (key.startsWith(`${userId}-`)) {
        const service = key.split('-')[1];
        stats[service] = {
          used: limit.count,
          resetTime: limit.resetTime
        };
      }
    }
    return stats;
  }
}

const aiService = new AIService();
module.exports = aiService;
