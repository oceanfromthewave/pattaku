import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginUser } from '../../api/authApi';
import { notifySuccess, notifyError } from '../../utils/notify';
import { API_BASE_URL } from '../../api/config';
import styles from '../../styles/LoginForm.module.scss';

function LoginForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 실시간 에러 제거
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = '사용자명을 입력해주세요.';
    } else if (formData.username.length < 3) {
      newErrors.username = '사용자명은 3자 이상이어야 합니다.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      
      const response = await loginUser(formData);
      
      // AuthContext를 통해 로그인 처리
      login(response.token, response.userId, response.username, response.nickname, response.profileImage);
      
      notifySuccess(`${response.nickname || response.username}님, 환영합니다!`);
      
      navigate('/');
    } catch (error) {
      
      // 서버 연결 문제 체크
      if (error.message.includes('ERR_CONNECTION_REFUSED') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('Network Error')) {
        notifyError('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        notifyError(error.message || '로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>🔑 로그인</h1>
          <p className={styles.loginSubtitle}>
            계정에 로그인하여 더 많은 기능을 이용해보세요
          </p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>사용자명</label>
            <input
              type="text"
              name="username"
              className={`${styles.formInput} ${errors.username ? styles.error : ''}`}
              placeholder="사용자명을 입력하세요"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
            />
            {errors.username && (
              <div className={styles.errorMessage}>{errors.username}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>비밀번호</label>
            <input
              type="password"
              name="password"
              className={`${styles.formInput} ${errors.password ? styles.error : ''}`}
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && (
              <div className={styles.errorMessage}>{errors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.spinner}></div>
                로그인 중...
              </>
            ) : (
              <>🔑 로그인</>
            )}
          </button>
        </form>

        <div className={styles.registerLink}>
          <p>
            아직 계정이 없으신가요?{' '}
            <RouterLink to="/register">회원가입하기</RouterLink>
          </p>
        </div>

        {/* 개발 정보 */}
        <div className={styles.devInfo}>
          <details>
            <summary style={{ cursor: 'pointer', color: '#666', fontSize: '12px' }}>
              개발자 정보
            </summary>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              <p>서버 URL: {import.meta.env.VITE_API_SERVER || 'http://localhost:5000'}</p>
              <p>서버가 실행되지 않은 경우 연결 오류가 발생합니다.</p>
              <p>터미널에서 <code>cd server && npm run dev</code> 실행하세요.</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
