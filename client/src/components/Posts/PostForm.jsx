// PostForm.jsx
import { useState } from 'react';
import styles from '../../styles/PostForm.module.scss';
import { notifySuccess, notifyError } from '../../utils/notify';

export default function PostForm({ onPost }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      notifyError('로그인 후 작성 가능합니다.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        notifySuccess('글이 성공적으로 등록되었습니다.');
        setForm({ title: '', content: '' });
        if (onPost) onPost();
      } else {
        notifyError(data.error || '글 등록에 실패했습니다.');
      }
    } catch (err) {
      notifyError('네트워크 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  return (
    <form className={styles.postForm} onSubmit={handleSubmit}>
      <h3>글 작성</h3>
      <input
        className={styles.input}
        name="title"
        placeholder="제목"
        value={form.title}
        onChange={handleChange}
        autoComplete="off"
        disabled={loading}
      />
      <textarea
        className={styles.textarea}
        name="content"
        placeholder="내용"
        value={form.content}
        onChange={handleChange}
        rows={6}
        disabled={loading}
      />
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? '로딩 중...' : '등록'}
      </button>
    </form>
  );
}
