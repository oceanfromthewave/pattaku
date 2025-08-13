// server/services/aiService.js - AI 서비스 통합
const axios = require('axios');
const crypto = require('crypto');

class AIService {
  constructor() {
    this.rateLimits = new Map(); // 사용자별 요청 제한
    this.cache = new Map(); // 결과 캐싱
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
      'summary': 10,
      'sentiment': 20,
      'spam': 50,
      'tags': 15,
      'translate': 30
    };
    
    if (limit.count >= (maxRequests[service] || 10)) {
      return false;
    }
    
    limit.count++;
    return true;
  }

  // 캐시 확인
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1시간 캐시
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
  }

  // 게시글 자동 요약
  async generatePostSummary(content, userId) {
    if (!this.checkRateLimit(userId, 'summary')) {
      throw new Error('요약 기능 사용 한도를 초과했습니다. 1시간 후 다시 시도해주세요.');
    }

    const cacheKey = `summary-${this.generateHash(content)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // 간단한 추출 요약 알고리즘
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const summary = sentences.slice(0, Math.min(3, sentences.length)).join('. ') + '.';
      
      this.setCache(cacheKey, summary);
      return summary;
    } catch (error) {
      console.error('AI 요약 생성 오류:', error);
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
        emotions: sentiment === 'positive' ? ['happy'] : sentiment === 'negative' ? ['sad'] : [],
        explanation: `긍정: ${positiveScore}, 부정: ${negativeScore}`
      };
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('감정 분석 오류:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        emotions: [],
        explanation: '분석할 수 없음'
      };
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

    try {
      const spamPatterns = [
        /\b(?:무료|공짜|100%|확실|보장)\b/gi,
        /\b(?:클릭|방문|가입|다운로드)\s*(?:하세요|해주세요|하면)\b/gi,
        /(?:http|www)\./gi,
        /\b(?:돈|수익|벌기|투자|대출)\b/gi,
        /(?:카카오톡|텔레그램|라인)\s*(?:추가|문의)/gi
      ];

      let spamScore = 0;
      const reasons = [];

      spamPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          spamScore += matches.length * 0.2;
          reasons.push(`의심스러운 패턴 감지: ${matches[0]}`);
        }
      });

      const repeatedChars = content.match(/(.)\1{4,}/g);
      if (repeatedChars) {
        spamScore += 0.3;
        reasons.push('반복 문자 감지');
      }

      const isSpam = spamScore > 0.6;

      const result = {
        isSpam,
        confidence: Math.min(1, spamScore),
        reason: isSpam ? '스팸으로 판단됨' : '정상 콘텐츠',
        categories: isSpam ? ['advertisement'] : [],
        patterns: reasons
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('스팸 감지 오류:', error);
      return {
        isSpam: false,
        confidence: 0,
        reason: '분석 실패'
      };
    }
  }

  // 자동 태그 추천
  async suggestTags(title, content, userId) {
    if (!this.checkRateLimit(userId, 'tags')) {
      throw new Error('태그 추천 기능 사용 한도를 초과했습니다.');
    }

    const cacheKey = `tags-${this.generateHash(title + content)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const text = (title + ' ' + content).toLowerCase();
      const keywords = [
        { tag: 'JavaScript', patterns: ['javascript', 'js', '자바스크립트'] },
        { tag: 'React', patterns: ['react', '리액트'] },
        { tag: 'Node.js', patterns: ['node', 'nodejs', '노드'] },
        { tag: '개발', patterns: ['개발', 'development', '코딩', 'programming'] },
        { tag: '프론트엔드', patterns: ['frontend', 'front-end', '프론트엔드'] },
        { tag: '백엔드', patterns: ['backend', 'back-end', '백엔드'] },
        { tag: 'HTML', patterns: ['html'] },
        { tag: 'CSS', patterns: ['css', '스타일'] },
        { tag: '데이터베이스', patterns: ['database', 'db', 'mysql', 'mongodb'] },
        { tag: '질문', patterns: ['질문', 'question', '도움', 'help'] }
      ];
      
      const suggestedTags = [];
      keywords.forEach(keyword => {
        const found = keyword.patterns.some(pattern => text.includes(pattern));
        if (found) {
          suggestedTags.push(keyword.tag);
        }
      });

      const result = {
        tags: suggestedTags.slice(0, 5),
        categories: ['기술'],
        confidence: suggestedTags.length > 0 ? 0.8 : 0.3
      };
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('태그 추천 오류:', error);
      return {
        tags: [],
        categories: [],
        confidence: 0
      };
    }
  }

  // 해시 생성
  generateHash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  // 사용량 통계
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
