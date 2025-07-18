import { useState } from 'react';
import { notifySuccess, notifyError } from '../../utils/notify';
import styles from '../../styles/LoginForm.module.scss';

export default function LoginForm({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if(res.ok) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('userId', data.userId); // userId도 응답에서 받아와야 함
  localStorage.setItem('username', data.username);
  localStorage.setItem('nickname', data.nickname);
  notifySuccess('로그인 성공!');
  if(onLogin) onLogin();
} else {
        notifyError(data.error || '로그인 실패');
      }
    } catch {
      notifyError('네트워크 오류');
    }
    setLoading(false);
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <h3 className={styles.title}>로그인</h3>
      <input
        className={styles.input}
        name="username"
        placeholder="아이디"
        onChange={handleChange}
        disabled={loading}
        value={form.username}
        autoComplete="username"
      />
      <input
        className={styles.input}
        name="password"
        type="password"
        placeholder="비밀번호"
        onChange={handleChange}
        disabled={loading}
        value={form.password}
        autoComplete="current-password"
      />
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? '로딩 중...' : '로그인'}
      </button>
    </form>
  );
}
