import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../../styles/PostForm.module.scss';
import { notifySuccess, notifyError } from '../../utils/notify';

export default function EditPostForm() {
  const { postId } = useParams();
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 게시글 불러오기
  useEffect(() => {
    fetch(`/api/posts/${postId}`)
      .then(res => {
        if (!res.ok) throw new Error('게시글을 불러오지 못했습니다.');
        return res.json();
      })
      .then(data => setForm({ title: data.title, content: data.content }))
      .catch(err => {
        notifyError(err.message || '불러오기 실패');
        navigate(-1); // 이전 페이지로
      });
  }, [postId, navigate]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        notifySuccess('게시글이 수정되었습니다!');
        navigate(`/board/free/${postId}`);
      } else {
        const data = await res.json();
        notifyError(data.error || '수정에 실패했습니다.');
      }
    } catch {
      notifyError('네트워크 오류');
    }
    setLoading(false);
  };

  return (
    <form className={styles.postForm} onSubmit={handleSubmit}>
      <h3>게시글 수정</h3>
      <input
        className={styles.input}
        name="title"
        placeholder="제목"
        value={form.title}
        onChange={handleChange}
        required
        maxLength={100}
        disabled={loading}
      />
      <textarea
        className={styles.textarea}
        name="content"
        placeholder="내용"
        value={form.content}
        onChange={handleChange}
        rows={8}
        required
        disabled={loading}
      />
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? '수정 중...' : '수정하기'}
      </button>
    </form>
  );
}
