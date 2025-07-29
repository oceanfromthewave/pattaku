import { useEffect, useState } from 'react';
import { 
  getScheduleComments, 
  createScheduleComment, 
  deleteScheduleComment,
  likeScheduleComment,
  dislikeScheduleComment,
  getApiErrorMessage 
} from '../../api/scheduleApi';
import { notifySuccess, notifyError } from '../../utils/notify';
import classNames from 'classnames';
import styles from '../../styles/ScheduleCommentList.module.scss';

// 좋아요/싫어요 상수
const VOTE = { LIKE: 'like', DISLIKE: 'dislike' };

export default function ScheduleCommentList({ scheduleId, isLogin, currentUser }) {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [replyInput, setReplyInput] = useState({});
  const [parentId, setParentId] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 댓글 불러오기
  useEffect(() => {
    const fetchComments = async () => {
      if (!scheduleId) return;
      
      setLoading(true);
      try {
        const data = await getScheduleComments(scheduleId);
        setComments(data || []);
      } catch (error) {
        console.error('댓글 로드 오류:', error);
        notifyError(getApiErrorMessage ? getApiErrorMessage(error) : '댓글을 불러오는데 실패했습니다.');
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [scheduleId, refresh]);

  // 댓글 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setSubmitting(true);
    try {
      await createScheduleComment(scheduleId, {
        content: input.trim(),
        parentId: null
      });
      setInput('');
      notifySuccess('댓글이 등록되었습니다.');
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('댓글 등록 오류:', error);
      notifyError(getApiErrorMessage ? getApiErrorMessage(error) : '댓글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 답글 등록
  const handleReplySubmit = async (parent) => {
    if (!replyInput[parent]?.trim()) return;
    
    setSubmitting(true);
    try {
      await createScheduleComment(scheduleId, {
        content: replyInput[parent].trim(),
        parentId: parent
      });
      setReplyInput(prev => ({ ...prev, [parent]: '' }));
      notifySuccess('답글이 등록되었습니다.');
      setParentId(null);
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('답글 등록 오류:', error);
      notifyError(getApiErrorMessage ? getApiErrorMessage(error) : '답글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?\n(답글이 있는 경우 답글도 함께 삭제됩니다)')) return;
    
    setSubmitting(true);
    try {
      await deleteScheduleComment(scheduleId, commentId);
      notifySuccess('댓글이 삭제되었습니다.');
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      notifyError(getApiErrorMessage ? getApiErrorMessage(error) : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 좋아요/싫어요 처리
  const handleVote = async (commentId, type) => {
    if (!isLogin) {
      notifyError('로그인 후 가능합니다.');
      return;
    }
    
    // 낙관적 업데이트 (즉시 UI 반영)
    const optimisticUpdate = (comments) => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          const currentLiked = comment.isLiked;
          const currentDisliked = comment.isDisliked;
          
          if (type === VOTE.LIKE) {
            if (currentLiked) {
              // 이미 좋아요 -> 취소
              return {
                ...comment,
                likes: Math.max(0, (comment.likes || 0) - 1),
                isLiked: false
              };
            } else {
              // 좋아요 추가 (기존 싫어요가 있다면 취소)
              return {
                ...comment,
                likes: (comment.likes || 0) + 1,
                dislikes: currentDisliked ? Math.max(0, (comment.dislikes || 0) - 1) : (comment.dislikes || 0),
                isLiked: true,
                isDisliked: false
              };
            }
          } else {
            if (currentDisliked) {
              // 이미 싫어요 -> 취소
              return {
                ...comment,
                dislikes: Math.max(0, (comment.dislikes || 0) - 1),
                isDisliked: false
              };
            } else {
              // 싫어요 추가 (기존 좋아요가 있다면 취소)
              return {
                ...comment,
                dislikes: (comment.dislikes || 0) + 1,
                likes: currentLiked ? Math.max(0, (comment.likes || 0) - 1) : (comment.likes || 0),
                isDisliked: true,
                isLiked: false
              };
            }
          }
        }
        return comment;
      });
    };
    
    // UI 즉시 업데이트
    setComments(optimisticUpdate);
    
    try {
      let result;
      if (type === VOTE.LIKE) {
        result = await likeScheduleComment(scheduleId, commentId);
      } else {
        result = await dislikeScheduleComment(scheduleId, commentId);
      }
      
      // 서버 응답으로 정확한 데이터 업데이트
      if (result) {
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === commentId 
              ? {
                  ...comment,
                  likes: result.likeCount || 0,
                  dislikes: result.dislikeCount || 0,
                  isLiked: result.isLiked || false,
                  isDisliked: result.isDisliked || false
                }
              : comment
          )
        );
      }
      
    } catch (error) {
      console.error('투표 처리 오류:', error);
      notifyError(getApiErrorMessage ? getApiErrorMessage(error) : '좋아요 처리에 실패했습니다.');
      // 에러 시 이전 상태로 되돌리기
      setRefresh(r => r + 1);
    }
  };

  // 답글 폼 토글
  const toggleReplyForm = (commentId) => {
    setParentId(prev => prev === commentId ? null : commentId);
    if (parentId === commentId) {
      setReplyInput(prev => ({ ...prev, [commentId]: '' }));
    }
  };

  // 입력 내용 변경 핸들러
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleReplyInputChange = (parentId, value) => {
    setReplyInput(prev => ({ ...prev, [parentId]: value }));
  };

  // 댓글 필터링 및 정렬
  const rootComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);
  const getReplies = (parentId) => replies.filter(r => r.parent_id === parentId);

  // 사용자 확인 (ID 기반)
  const isMyComment = (comment) => {
    return isLogin && String(comment.user_id) === String(currentUser);
  };

  // 댓글 작성자 표시 이름
  const getDisplayName = (comment) => {
    return comment.author_nickname || comment.author || '익명';
  };

  // 날짜 포맷팅
  const formatCommentDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={classNames(styles['comment-list-wrap'], 'comment-list-wrap')}>
      <div className={styles['comment-list-inner']}>
        <div className={styles['comment-header']}>
          <h4 className={styles['comment-title']}>
            일정 댓글 {comments.length > 0 && `(${comments.length})`}
          </h4>
        </div>
        
        {isLogin ? (
          <form className={styles['comment-form']} onSubmit={handleSubmit}>
            <div className={styles['comment-input-group']}>
              <textarea
                placeholder="일정에 대한 댓글을 입력하세요"
                value={input}
                onChange={handleInputChange}
                rows={3}
                className={styles.textarea}
                maxLength={1000}
                disabled={loading || submitting}
                aria-label="댓글 내용 입력"
              />
              <div className={styles['comment-form-footer']}>
                <span className={styles['char-count']}>
                  {input.length}/1000
                </span>
                <button 
                  type="submit" 
                  className={styles.button} 
                  disabled={loading || submitting || !input.trim()}
                  aria-label="댓글 등록"
                >
                  {submitting ? '등록 중...' : '댓글 등록'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className={styles['comment-login-ask']}>
            로그인 후 댓글 작성이 가능합니다.
          </div>
        )}
        
        <ul className={styles['comment-list']} role="list">
          {loading && comments.length === 0 ? (
            <li className={styles['comment-loading']} role="status" aria-live="polite">
              댓글을 불러오는 중...
            </li>
          ) : null}
          
          {comments.length === 0 && !loading ? (
            <li className={styles['comment-empty']} role="status">
              아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
            </li>
          ) : null}
          
          {rootComments.map(comment => (
            <li key={comment.id} className={styles['comment-item']} role="listitem">
              <div className={styles['comment-head']}>
                <span className={styles['comment-author']}>
                  👤 {getDisplayName(comment)}
                </span>
                <time 
                  className={styles['comment-date']}
                  dateTime={comment.created_at}
                  title={formatCommentDate(comment.created_at)}
                >
                  {formatCommentDate(comment.created_at)}
                </time>
              </div>
              
              <div className={styles['comment-content']}>
                {comment.content}
                {comment.file_url && (
                  <img 
                    src={comment.file_url} 
                    alt="첨부 이미지" 
                    className={styles.commentImg}
                    loading="lazy"
                  />
                )}
              </div>
              
              <div className={styles['comment-actions']}>
                <div className={styles['comment-vote-group']} role="group" aria-label="댓글 평가">
                  <button
                    className={classNames(
                      styles['comment-like-btn'],
                      { [styles['liked']]: comment.isLiked }
                    )}
                    onClick={() => handleVote(comment.id, VOTE.LIKE)}
                    type="button"
                    disabled={loading || submitting}
                    aria-label={`좋아요 ${comment.likes || 0}개`}
                  >
                    👍 {comment.likes || 0}
                  </button>
                  <button
                    className={classNames(
                      styles['comment-dislike-btn'],
                      { [styles['disliked']]: comment.isDisliked }
                    )}
                    onClick={() => handleVote(comment.id, VOTE.DISLIKE)}
                    type="button"
                    disabled={loading || submitting}
                    aria-label={`싫어요 ${comment.dislikes || 0}개`}
                  >
                    👎 {comment.dislikes || 0}
                  </button>
                </div>
                
                <div className={styles['comment-control-group']} role="group" aria-label="댓글 관리">
                  {isLogin && (
                    <button
                      className={styles['comment-reply-btn']}
                      onClick={() => toggleReplyForm(comment.id)}
                      type="button"
                      disabled={submitting}
                      aria-label={parentId === comment.id ? '답글 취소' : '답글 작성'}
                    >
                      {parentId === comment.id ? '취소' : '답글'}
                    </button>
                  )}
                  
                  {isMyComment(comment) && (
                    <button 
                      className={styles['comment-del-btn']} 
                      onClick={() => handleDelete(comment.id)}
                      type="button"
                      disabled={submitting}
                      aria-label="댓글 삭제"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              
              {/* 답글 입력폼 */}
              {parentId === comment.id && (
                <div className={styles['comment-reply-form']}>
                  <div className={styles['reply-input-group']}>
                    <textarea
                      placeholder="답글을 입력하세요"
                      value={replyInput[comment.id] || ''}
                      onChange={e => handleReplyInputChange(comment.id, e.target.value)}
                      rows={2}
                      className={styles.textarea}
                      maxLength={1000}
                      disabled={loading || submitting}
                      aria-label="답글 내용 입력"
                    />
                    <button
                      className={styles['reply-submit-btn']}
                      onClick={() => handleReplySubmit(comment.id)}
                      type="button"
                      disabled={loading || submitting || !replyInput[comment.id]?.trim()}
                      aria-label="답글 등록"
                    >
                      {submitting ? '등록 중...' : '답글 등록'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* 답글들 */}
              {getReplies(comment.id).length > 0 && (
                <ul className={styles['comment-replies']} role="list" aria-label={`${getDisplayName(comment)}님 댓글의 답글`}>
                  {getReplies(comment.id).map(reply => (
                    <li 
                      key={reply.id} 
                      className={classNames(styles['comment-item'], styles['comment-reply'])}
                      role="listitem"
                    >
                      <div className={styles['comment-head']}>
                        <span className={styles['comment-author']}>
                          👤 {getDisplayName(reply)}
                        </span>
                        <time 
                          className={styles['comment-date']}
                          dateTime={reply.created_at}
                          title={formatCommentDate(reply.created_at)}
                        >
                          {formatCommentDate(reply.created_at)}
                        </time>
                      </div>
                      
                      <div className={styles['comment-content']}>
                        {reply.content}
                        {reply.file_url && (
                          <img 
                            src={reply.file_url} 
                            alt="답글 이미지" 
                            className={styles.commentImg}
                            loading="lazy"
                          />
                        )}
                      </div>
                      
                      <div className={styles['comment-actions']}>
                        <div className={styles['comment-vote-group']} role="group" aria-label="답글 평가">
                          <button
                            className={classNames(
                              styles['comment-like-btn'],
                              { [styles['liked']]: reply.isLiked }
                            )}
                            onClick={() => handleVote(reply.id, VOTE.LIKE)}
                            type="button"
                            disabled={loading || submitting}
                            aria-label={`좋아요 ${reply.likes || 0}개`}
                          >
                            👍 {reply.likes || 0}
                          </button>
                          <button
                            className={classNames(
                              styles['comment-dislike-btn'],
                              { [styles['disliked']]: reply.isDisliked }
                            )}
                            onClick={() => handleVote(reply.id, VOTE.DISLIKE)}
                            type="button"
                            disabled={loading || submitting}
                            aria-label={`싫어요 ${reply.dislikes || 0}개`}
                          >
                            👎 {reply.dislikes || 0}
                          </button>
                        </div>
                        
                        {isMyComment(reply) && (
                          <div className={styles['comment-control-group']}>
                            <button 
                              className={styles['comment-del-btn']} 
                              onClick={() => handleDelete(reply.id)}
                              type="button"
                              disabled={submitting}
                              aria-label="답글 삭제"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}