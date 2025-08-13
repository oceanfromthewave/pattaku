// components/AI/AIAssistant.jsx - 통합 AI 어시스턴트 컴포넌트
import React, { useState, useCallback } from 'react';
import { aiApi, aiUtils } from '../../api/aiApi';
import { toast } from 'react-toastify';
import styles from './AIAssistant.module.scss';

export default function AIAssistant({ 
  content, 
  title = '', 
  onSuggestion, 
  onUpdate,
  disabled = false 
}) {
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
      color: '#667eea',
      minLength: 100
    },
    {
      id: 'sentiment',
      name: '감정분석',
      icon: '😊',
      description: '텍스트의 감정과 톤 분석',
      color: '#48bb78',
      minLength: 10
    },
    {
      id: 'tags',
      name: '태그추천',
      icon: '🏷️',
      description: '내용에 맞는 태그 자동 추천',
      color: '#ed8936',
      minLength: 20
    }
  ];

  const handleFeatureClick = useCallback(async (feature) => {
    if (disabled) {
      toast.warn('현재 AI 기능을 사용할 수 없습니다.');
      return;
    }

    if (!content || content.trim().length < feature.minLength) {
      toast.warn(`${feature.name} 기능을 사용하려면 최소 ${feature.minLength}자 이상 입력해주세요.`);
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
          result = await aiApi.suggestTags(title, content);
          break;
        default:
          throw new Error('지원하지 않는 기능입니다.');
      }

      setResults(prev => ({ ...prev, [feature.id]: result }));
      setShowPanel(true);
      
      if (onSuggestion) {
        onSuggestion(feature.id, result);
      }

      toast.success(`${feature.name} 완료!`);

    } catch (error) {
      console.error(`${feature.name} 오류:`, error);
      toast.error(error.message || `${feature.name} 기능 사용 중 오류가 발생했습니다.`);
    } finally {
      setLoading(false);
      setActiveFeature(null);
    }
  }, [content, title, disabled, onSuggestion]);

  const renderResult = (featureId, result) => {
    switch (featureId) {
      case 'summarize':
        return (
          <div className={styles.resultContent}>
            <h4>📝 요약 결과</h4>
            <div className={styles.summary}>
              {result.summary}
            </div>
            {onUpdate && (
              <button 
                className={styles.applyButton}
                onClick={() => onUpdate(result.summary)}
              >
                요약문 적용
              </button>
            )}
          </div>
        );

      case 'sentiment':
        const analysis = result.analysis;
        return (
          <div className={styles.resultContent}>
            <h4>😊 감정 분석 결과</h4>
            <div className={styles.sentimentAnalysis}>
              <div className={styles.sentimentMain}>
                <span className={`${styles.sentimentBadge} ${styles[analysis.sentiment]}`}>
                  {aiUtils.getSentimentEmoji(analysis.sentiment)} {aiUtils.getSentimentText(analysis.sentiment)}
                </span>
                <span className={styles.confidence}>
                  신뢰도: {aiUtils.getConfidencePercent(analysis.confidence)}%
                </span>
              </div>
              
              {analysis.emotions && analysis.emotions.length > 0 && (
                <div className={styles.emotions}>
                  <strong>감지된 감정:</strong>
                  {analysis.emotions.map((emotion, index) => (
                    <span key={index} className={styles.emotionTag}>
                      {emotion}
                    </span>
                  ))}
                </div>
              )}
              
              {analysis.explanation && (
                <div className={styles.explanation}>
                  <strong>분석:</strong> {analysis.explanation}
                </div>
              )}
            </div>
          </div>
        );

      case 'tags':
        const suggestions = result.suggestions;
        const formattedTags = aiUtils.formatTags(suggestions.tags);
        
        return (
          <div className={styles.resultContent}>
            <h4>🏷️ 추천 태그</h4>
            {formattedTags.length > 0 ? (
              <>
                <div className={styles.tagSuggestions}>
                  {formattedTags.map((tag, index) => (
                    <button
                      key={index}
                      className={styles.tagButton}
                      onClick={() => onSuggestion && onSuggestion('addTag', tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
                
                {suggestions.categories && suggestions.categories.length > 0 && (
                  <div className={styles.categories}>
                    <strong>카테고리:</strong>
                    {suggestions.categories.map((category, index) => (
                      <span key={index} className={styles.categoryTag}>
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className={styles.noResults}>추천할 태그가 없습니다.</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${styles.aiAssistant} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.aiToolbar}>
        <div className={styles.toolbarHeader}>
          <span className={styles.aiIcon}>🤖</span>
          <span className={styles.aiTitle}>AI 어시스턴트</span>
          {Object.keys(results).length > 0 && (
            <span className={styles.resultsCount}>
              {Object.keys(results).length}개 결과
            </span>
          )}
        </div>
        
        <div className={styles.featureButtons}>
          {features.map(feature => {
            const isActive = activeFeature === feature.id;
            const hasResult = !!results[feature.id];
            const canUse = content && content.trim().length >= feature.minLength;
            
            return (
              <button
                key={feature.id}
                className={`${styles.featureButton} 
                  ${isActive ? styles.loading : ''} 
                  ${hasResult ? styles.hasResult : ''}
                  ${!canUse ? styles.unavailable : ''}`}
                onClick={() => handleFeatureClick(feature)}
                disabled={loading || disabled || !canUse}
                style={{ '--feature-color': feature.color }}
                title={canUse ? feature.description : `최소 ${feature.minLength}자 이상 필요`}
              >
                {isActive ? (
                  <div className={styles.spinner} />
                ) : (
                  <>
                    <span className={styles.featureIcon}>{feature.icon}</span>
                    <span className={styles.featureName}>{feature.name}</span>
                    {hasResult && <span className={styles.resultDot}>●</span>}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showPanel && Object.keys(results).length > 0 && (
        <div className={styles.resultsPanel}>
          <div className={styles.panelHeader}>
            <h3>🎯 AI 분석 결과</h3>
            <button 
              className={styles.closeButton}
              onClick={() => setShowPanel(false)}
              title="결과 패널 닫기"
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
          
          <div className={styles.panelFooter}>
            <button 
              className={styles.clearButton}
              onClick={() => {
                setResults({});
                setShowPanel(false);
              }}
            >
              결과 지우기
            </button>
          </div>
        </div>
      )}

      {/* 사용 가이드 */}
      {!content && (
        <div className={styles.guide}>
          <p>💡 텍스트를 입력하면 AI 기능을 사용할 수 있습니다</p>
        </div>
      )}
    </div>
  );
}
