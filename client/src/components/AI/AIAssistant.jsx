// components/AI/AIAssistant.jsx - AI 어시스턴트 컴포넌트
import React, { useState } from 'react';
import styles from '../../styles/AIAssistant.module.scss';

const aiApi = {
  summarizeText: async (content) => {
    const response = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '요약 생성에 실패했습니다.');
    }
    
    return await response.json();
  },

  analyzeSentiment: async (text) => {
    const response = await fetch('/api/ai/sentiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '감정 분석에 실패했습니다.');
    }
    
    return await response.json();
  },

  suggestTags: async (title, content) => {
    const response = await fetch('/api/ai/suggest-tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ title, content })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '태그 추천에 실패했습니다.');
    }
    
    return await response.json();
  }
};

export default function AIAssistant({ content, onSuggestion, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [results, setResults] = useState({});
  const [showPanel, setShowPanel] = useState(false);

  const features = [
    {
      id: 'summarize',
      name: '요약',
      icon: '📝',
      description: '긴 텍스트를 핵심 내용으로 요약',
      color: '#667eea'
    },
    {
      id: 'sentiment',
      name: '감정분석',
      icon: '😊',
      description: '텍스트의 감정과 톤 분석',
      color: '#48bb78'
    },
    {
      id: 'tags',
      name: '태그추천',
      icon: '🏷️',
      description: '내용에 맞는 태그 자동 추천',
      color: '#ed8936'
    }
  ];

  const handleFeatureClick = async (feature) => {
    if (!content || content.trim().length < 10) {
      alert('분석할 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    setActiveFeature(feature.id);

    try {
      let result;
      
      switch (feature.id) {
        case 'summarize':
          result = await aiApi.summarizeText(content);
          break;
        case 'sentiment':
          result = await aiApi.analyzeSentiment(content);
          break;
        case 'tags':
          result = await aiApi.suggestTags('', content);
          break;
        default:
          return;
      }

      setResults(prev => ({ ...prev, [feature.id]: result }));
      setShowPanel(true);
      
      if (onSuggestion) {
        onSuggestion(feature.id, result);
      }

    } catch (error) {
      console.error(`${feature.name} 오류:`, error);
      alert(error.message || `${feature.name} 기능 사용 중 오류가 발생했습니다.`);
    } finally {
      setLoading(false);
      setActiveFeature(null);
    }
  };

  const renderResult = (featureId, result) => {
    switch (featureId) {
      case 'summarize':
        return (
          <div className={styles.resultContent}>
            <h4>📝 요약 결과</h4>
            <div className={styles.summary}>
              {result.summary}
            </div>
            <button 
              className={styles.applyButton}
              onClick={() => onUpdate && onUpdate(result.summary)}
            >
              요약문 적용
            </button>
          </div>
        );

      case 'sentiment':
        return (
          <div className={styles.resultContent}>
            <h4>😊 감정 분석 결과</h4>
            <div className={styles.sentimentAnalysis}>
              <div className={styles.sentimentMain}>
                <span className={`${styles.sentimentBadge} ${styles[result.analysis.sentiment]}`}>
                  {result.analysis.sentiment === 'positive' && '긍정적'}
                  {result.analysis.sentiment === 'negative' && '부정적'}
                  {result.analysis.sentiment === 'neutral' && '중립적'}
                </span>
                <span className={styles.confidence}>
                  신뢰도: {Math.round(result.analysis.confidence * 100)}%
                </span>
              </div>
              <div className={styles.emotions}>
                <strong>감지된 감정:</strong>
                {result.analysis.emotions.map((emotion, index) => (
                  <span key={index} className={styles.emotionTag}>
                    {emotion}
                  </span>
                ))}
              </div>
              <div className={styles.explanation}>
                <strong>분석:</strong> {result.analysis.explanation}
              </div>
            </div>
          </div>
        );

      case 'tags':
        return (
          <div className={styles.resultContent}>
            <h4>🏷️ 추천 태그</h4>
            <div className={styles.tagSuggestions}>
              {result.suggestions.tags.map((tag, index) => (
                <button
                  key={index}
                  className={styles.tagButton}
                  onClick={() => onSuggestion && onSuggestion('addTag', tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
            <div className={styles.categories}>
              <strong>카테고리:</strong>
              {result.suggestions.categories.map((category, index) => (
                <span key={index} className={styles.categoryTag}>
                  {category}
                </span>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.aiAssistant}>
      <div className={styles.aiToolbar}>
        <div className={styles.toolbarHeader}>
          <span className={styles.aiIcon}>🤖</span>
          <span className={styles.aiTitle}>AI 어시스턴트</span>
        </div>
        
        <div className={styles.featureButtons}>
          {features.map(feature => (
            <button
              key={feature.id}
              className={`${styles.featureButton} ${activeFeature === feature.id ? styles.loading : ''}`}
              onClick={() => handleFeatureClick(feature)}
              disabled={loading}
              style={{ '--feature-color': feature.color }}
              title={feature.description}
            >
              {activeFeature === feature.id ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  <span className={styles.featureIcon}>{feature.icon}</span>
                  <span className={styles.featureName}>{feature.name}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {showPanel && Object.keys(results).length > 0 && (
        <div className={styles.resultsPanel}>
          <div className={styles.panelHeader}>
            <h3>AI 분석 결과</h3>
            <button 
              className={styles.closeButton}
              onClick={() => setShowPanel(false)}
            >
              ✕
            </button>
          </div>
          
          <div className={styles.panelContent}>
            {Object.entries(results).map(([featureId, result]) => (
              <div key={featureId} className={styles.resultSection}>
                {renderResult(featureId, result)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
