// api/aiApi.js - AI 기능 API 클라이언트
import { API_BASE_URL, apiRequest } from './config';

export const aiApi = {
  // 텍스트 요약
  summarizeText: async (content) => {
    return await apiRequest('/api/ai/summarize', {
      method: 'POST',
      body: { content }
    });
  },

  // 감정 분석
  analyzeSentiment: async (text) => {
    return await apiRequest('/api/ai/sentiment', {
      method: 'POST',
      body: { text }
    });
  },

  // 태그 추천
  suggestTags: async (title, content) => {
    return await apiRequest('/api/ai/suggest-tags', {
      method: 'POST',
      body: { title, content }
    });
  },

  // 스팸 감지 (관리자용)
  detectSpam: async (content) => {
    return await apiRequest('/api/ai/spam-check', {
      method: 'POST',
      body: { content }
    });
  },

  // AI 사용량 조회
  getUsage: async () => {
    return await apiRequest('/api/ai/usage');
  }
};

// AI 유틸리티 함수들
export const aiUtils = {
  // 감정 분석 결과를 한글로 변환
  getSentimentText: (sentiment) => {
    const sentimentMap = {
      'positive': '긍정적',
      'negative': '부정적',
      'neutral': '중립적'
    };
    return sentimentMap[sentiment] || '알 수 없음';
  },

  // 감정 분석 결과에 따른 이모지
  getSentimentEmoji: (sentiment) => {
    const emojiMap = {
      'positive': '😊',
      'negative': '😢',
      'neutral': '😐'
    };
    return emojiMap[sentiment] || '❓';
  },

  // 신뢰도를 퍼센트로 변환
  getConfidencePercent: (confidence) => {
    return Math.round((confidence || 0) * 100);
  },

  // 태그 포맷팅 (중복 제거 및 정리)
  formatTags: (tags) => {
    if (!Array.isArray(tags)) return [];
    
    return [...new Set(tags)]
      .filter(tag => tag && tag.trim())
      .map(tag => tag.trim())
      .slice(0, 5); // 최대 5개로 제한
  }
};
