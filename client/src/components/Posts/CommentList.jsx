import {useEffect, useState} from 'react';
import classNames from 'classnames';
import {notifySuccess, notifyError} from '../../utils/notify';
import styles from '../../styles/CommentList.module.scss';
import authFetch from '../../utils/authFetch';

const VOTE = {
    LIKE: 'like',
    DISLIKE: 'dislike'
};

export default function CommentList({
    postId,
    isLogin,
    currentUser,
    showLike = true,
    type = 'post'
}) {
    const [comments, setComments] = useState([]);
    const [input, setInput] = useState('');
    const [parentId, setParentId] = useState(null);
    const [replyInput, setReplyInput] = useState({});
    const [editId, setEditId] = useState(null);
    const [editInput, setEditInput] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [likeStates, setLikeStates] = useState({});
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL;
        fetch(
            `${apiUrl}/api/${type === 'schedule'
                ? 'schedules'
                : 'posts'}/${postId}/comments`
        )
            .then(res => res.json())
            .then(data => {
                setComments(data);
                if (showLike) {
                    const obj = {};
                    data.forEach(c => {
                        obj[c.id] = {
                            likeCount: Number(c.likes) || 0,
                            dislikeCount: Number(c.dislikes) || 0,
                            liked: Boolean(c.isLiked),
                            disliked: Boolean(c.isDisliked)
                        };
                    });
                    setLikeStates(obj);
                }
            })
            . finally(() => setLoading(false));
    }, [postId, refresh, type, showLike]);

    // 댓글 등록
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) 
            return;
        setLoading(true);
        try {
            const res = await authFetch(`/api/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({postId, content: input, parentId: '', type})
            });
            if (!res.ok) 
                throw new Error();
            setInput('');
            setRefresh(v => v + 1);
            notifySuccess('댓글이 등록되었습니다.');
        } catch  {
            notifyError('댓글 등록 실패');
        } finally {
            setLoading(false);
        }
    };

    // 답글 등록
    const handleReplySubmit = async (parentId) => {
        if (!replyInput[parentId]) 
            return;
        setLoading(true);
        try {
            const res = await authFetch(`/api/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    postId,
                    content: replyInput[parentId] || '',
                    parentId,
                    type
                })
            });
            if (!res.ok) 
                throw new Error();
            setReplyInput(prev => ({
                ...prev,
                [parentId]: ''
            }));
            setParentId(null);
            setRefresh(v => v + 1);
            notifySuccess('답글이 등록되었습니다.');
        } catch  {
            notifyError('답글 등록 실패');
        } finally {
            setLoading(false);
        }
    };

    // 댓글/답글 수정
    const handleEditSubmit = async (commentId) => {
        if (!editInput.trim()) 
            return;
        setLoading(true);
        try {
            const res = await authFetch(`/api/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({content: editInput})
            });
            if (!res.ok) 
                throw new Error();
            setEditId(null);
            setEditInput('');
            setRefresh(v => v + 1);
            notifySuccess('수정되었습니다.');
        } catch  {
            notifyError('수정 실패');
        } finally {
            setLoading(false);
        }
    };

    // 삭제
    const handleDelete = async (commentId) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) 
            return;
        setLoading(true);
        try {
            const res = await authFetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) 
                throw new Error();
            setRefresh(v => v + 1);
            notifySuccess('삭제되었습니다.');
        } catch  {
            notifyError('삭제 실패');
        } finally {
            setLoading(false);
        }
    };

    // 좋아요/싫어요
    const handleVote = async (commentId, type) => {
        if (!token) {
            notifyError('로그인 후 가능합니다.');
            return;
        }
        try {
            const res = await authFetch(`/api/comments/${commentId}/${type}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) 
                throw new Error();
            const data = await res.json();
            setLikeStates(prev => ({
                ...prev,
                [commentId]: {
                    likeCount: Number(data.likes) || 0,
                    dislikeCount: Number(data.dislikes) || 0,
                    liked: Boolean(data.liked),
                    disliked: Boolean(data.disliked)
                }
            }));
        } catch  {
            notifyError('추천 처리 실패');
        }
    };

    const rootComments = comments.filter(c => !c.parent_id);
    const replies = comments.filter(c => c.parent_id);
    const getReplies = (parentId) => replies.filter(r => r.parent_id === parentId);

    const isMyComment = (comment) => isLogin && String(comment.user_id) === String(
        currentUser
    );

    return (
        <div className={classNames(styles.commentListRoot, 'comment-list-wrap')}>
            <div className={styles.commentListInner}>
                {
                    isLogin
                        ? (
                            <form className={styles.commentForm} onSubmit={handleSubmit}>
                                <textarea
                                    placeholder="댓글을 입력하세요"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    rows={2}
                                    className={styles.textarea}
                                    maxLength={400}
                                    disabled={loading}/>
                                <button type="submit" className={styles.btn} disabled={loading}>
                                    등록
                                </button>
                            </form>
                        )
                        : (<div className={styles.commentLoginAsk}>로그인 후 댓글 작성 가능</div>)
                }
                <ul className={styles.commentList}>
                    {
                        loading
                            ? <li className={styles.loading}>로딩중...</li>
                            : null
                    }
                    {
                        rootComments.map(comment => (
                            <li key={comment.id} className={styles.commentItem}>
                                <div className={styles.commentHead}>
                                    <span className={styles.commentAuthor}>{comment.author_nickname || comment.author}</span>
                                    <span className={styles.commentDate}>{new Date(comment.created_at).toLocaleString()}</span>
                                    <div className={styles.commentActions}>
                                        {
                                            showLike && (
                                                <> < button className = {
                                                    classNames(styles.commentLikeBtn, {
                                                        [styles.liked]: likeStates[comment.id]
                                                            ?.liked
                                                    })
                                                }
                                                onClick = {
                                                    () => handleVote(comment.id, VOTE.LIKE)
                                                }
                                                type = "button" aria - label = "좋아요" disabled = {
                                                    loading
                                                } > 👍 {
                                                    likeStates[comment.id]
                                                        ?.likeCount || 0
                                                } < /button>
                      <button
                        className={classNames(
                          styles.commentDislikeBtn,
                          { [styles.disliked]: likeStates[comment.id]?.disliked }
                        )}
                        onClick={() => handleVote(comment.id, VOTE.DISLIKE)}
                        type="button"
                        aria-label="싫어요"
                        disabled={loading}
                      >
                        👎 {likeStates[comment.id]?.dislikeCount || 0}
                      </button > </>
                                            )
                                        }
                                        {
                                            isMyComment(comment) && (
                                                <> < button className = {
                                                    styles.commentDel
                                                }
                                                onClick = {
                                                    () => handleDelete(comment.id)
                                                } > 삭제 < /button>
                      <button
                        className={styles.commentEditBtn}
                        onClick={() => {
                          setEditId(comment.id);
                          setEditInput(comment.content);
                        }}
                      >
                        수정
                      </button > </>
                                            )
                                        }
                                        {
                                            isLogin && (
                                                <button
                                                    className={styles.commentReplyBtn}
                                                    onClick={() => setParentId(
                                                        parentId === comment.id
                                                            ? null
                                                            : comment.id
                                                    )}>
                                                    {
                                                        parentId === comment.id
                                                            ? '취소'
                                                            : '답글'
                                                    }
                                                </button>
                                            )
                                        }
                                    </div>
                                </div>
                                {
                                    editId === comment.id
                                        ? (
                                            <div className={styles.commentEditForm}>
                                                <textarea
                                                    value={editInput}
                                                    onChange={e => setEditInput(e.target.value)}
                                                    rows={2}
                                                    className={styles.textarea}
                                                    maxLength={400}
                                                    disabled={loading}/>
                                                <div className={styles.editActionBtns}>
                                                    <button
                                                        className={styles.btn}
                                                        onClick={() => handleEditSubmit(comment.id)}
                                                        type="button"
                                                        disabled={loading}>
                                                        저장
                                                    </button>
                                                    <button
                                                        className={styles.btn}
                                                        onClick={() => setEditId(null)}
                                                        type="button"
                                                        disabled={loading}>
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                        : (
                                            <div className={styles.commentContent}>
                                                {comment.content}
                                            </div>
                                        )
                                }
                                {/* 답글 입력폼 */}
                                {
                                    parentId === comment.id && (
                                        <div className={styles.commentReplyForm}>
                                            <textarea
                                                placeholder="답글을 입력하세요"
                                                value={replyInput[comment.id] || ''}
                                                onChange={e => setReplyInput(prev => ({
                                                    ...prev,
                                                    [comment.id]: e.target.value
                                                }))}
                                                rows={2}
                                                className={styles.textarea}
                                                maxLength={400}
                                                disabled={loading}/>
                                            <button
                                                className={styles.btn}
                                                onClick={() => handleReplySubmit(comment.id)}
                                                type="button"
                                                disabled={loading}>
                                                등록
                                            </button>
                                        </div>
                                    )
                                }
                                {/* 답글(들) */}
                                <ul className={styles.commentReplies}>
                                    {
                                        getReplies(comment.id).map(reply => (
                                            <li
                                                key={reply.id}
                                                className={classNames(styles.commentItem, styles.commentReply)}>
                                                <div className={styles.replyMetaWrap}>
                                                    <span className={styles.replyArrow}>↳</span>
                                                    <span className={styles.commentAuthor}>{reply.author_nickname || reply.author}</span>
                                                    <span className={styles.commentDate}>{new Date(reply.created_at).toLocaleString()}</span>
                                                </div>
                                                <div className={styles.commentActions}>
                                                    {
                                                        showLike && (
                                                            <> < button className = {
                                                                classNames(styles.commentLikeBtn, {
                                                                    [styles.liked]: likeStates[reply.id]
                                                                        ?.liked
                                                                })
                                                            }
                                                            onClick = {
                                                                () => handleVote(reply.id, VOTE.LIKE)
                                                            }
                                                            type = "button" aria - label = "좋아요" disabled = {
                                                                loading
                                                            } > 👍 {
                                                                likeStates[reply.id]
                                                                    ?.likeCount || 0
                                                            } < /button>
                          <button
                            className={classNames(
                              styles.commentDislikeBtn,
                              { [styles.disliked]: likeStates[reply.id]?.disliked }
                            )}
                            onClick={() => handleVote(reply.id, VOTE.DISLIKE)}
                            type="button"
                            aria-label="싫어요"
                            disabled={loading}
                          >
                            👎 {likeStates[reply.id]?.dislikeCount || 0}
                          </button > </>
                                                        )
                                                    }
                                                    {
                                                        isMyComment(reply) && (
                                                            <> < button className = {
                                                                styles.commentDel
                                                            }
                                                            onClick = {
                                                                () => handleDelete(reply.id)
                                                            } > 삭제 < /button>
                          <button
                            className={styles.commentEditBtn}
                            onClick={() => {
                              setEditId(reply.id);
                              setEditInput(reply.content);
                            }}
                          >
                            수정
                          </button > </>
                                                        )
                                                    }
                                                </div>
                                                {
                                                    editId === reply.id
                                                        ? (
                                                            <div className={styles.commentEditForm}>
                                                                <textarea
                                                                    value={editInput}
                                                                    onChange={e => setEditInput(e.target.value)}
                                                                    rows={2}
                                                                    className={styles.textarea}
                                                                    maxLength={400}
                                                                    disabled={loading}/>
                                                                <div className={styles.editActionBtns}>
                                                                    <button
                                                                        className={styles.btn}
                                                                        onClick={() => handleEditSubmit(reply.id)}
                                                                        type="button"
                                                                        disabled={loading}>
                                                                        저장
                                                                    </button>
                                                                    <button
                                                                        className={styles.btn}
                                                                        onClick={() => setEditId(null)}
                                                                        type="button"
                                                                        disabled={loading}>
                                                                        취소
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )
                                                        : (
                                                            <div className={styles.commentContent}>
                                                                {reply.content}
                                                            </div>
                                                        )
                                                }
                                            </li>
                                        ))
                                    }
                                </ul>
                            </li>
                        ))
                    }
                </ul>
            </div>
        </div>
    );
}
