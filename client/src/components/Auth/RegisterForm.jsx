import React, {useState} from 'react';
import {useNavigate, Link as RouterLink} from 'react-router-dom';
import {registerUser} from '../../api/authApi';
import {notifySuccess, notifyError} from '../../utils/notify';
import styles from '../../styles/RegisterForm.module.scss';

function RegisterForm() {
    const [formData, setFormData] = useState(
        {username: '', email: '', nickname: '', password: ''}
    );
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (errors[name]) 
            setErrors({
                ...errors,
                [name]: ''
            });
        };
    
    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) 
            newErrors.username = '사용자명을 입력해주세요.';
        else if (formData.username.length < 3) 
            newErrors.username = '사용자명은 3자 이상이어야 합니다.';
        if (!formData.email.trim()) 
            newErrors.email = '이메일을 입력해주세요.';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) 
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
        if (!formData.nickname.trim()) 
            newErrors.nickname = '닉네임을 입력해주세요.';
        else if (formData.nickname.length < 2) 
            newErrors.nickname = '닉네임은 2자 이상이어야 합니다.';
        if (!formData.password) 
            newErrors.password = '비밀번호를 입력해주세요.';
        else if (formData.password.length < 6) 
            newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
        setErrors(newErrors);
        return Object
            .keys(newErrors)
            .length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) 
            return;
        setLoading(true);
        try {
            await registerUser(formData);
            notifySuccess('회원가입이 완료되었습니다! 로그인해주세요.');
            navigate('/login');
        } catch (error) {
            notifyError(error.message || '회원가입에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.registerContainer}>
            <div className={styles.registerCard}>
                <div className={styles.registerHeader}>
                    <h1 className={styles.registerTitle}>🎉 회원가입</h1>
                    <p className={styles.registerSubtitle}>
                        Pattaku에 오신 것을 환영합니다!
                    </p>
                </div>

                <form className={styles.registerForm} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>사용자명</label>
                        <input
                            type="text"
                            name="username"
                            className={`${styles.formInput} ${errors.username
                                ? styles.error
                                : ''}`}
                            placeholder="사용자명을 입력하세요"
                            value={formData.username}
                            onChange={handleChange}
                            autoComplete="username"/> {
                            errors.username && (
                                <div className={styles.errorMessage}>{errors.username}</div>
                            )
                        }
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>비밀번호</label>
                        <input
                            type="password"
                            name="password"
                            className={`${styles.formInput} ${errors.password
                                ? styles.error
                                : ''}`}
                            placeholder="비밀번호를 입력하세요 (6자 이상)"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"/> {
                            errors.password && (
                                <div className={styles.errorMessage}>{errors.password}</div>
                            )
                        }
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>닉네임</label>
                        <input
                            type="text"
                            name="nickname"
                            className={`${styles.formInput} ${errors.nickname
                                ? styles.error
                                : ''}`}
                            placeholder="닉네임을 입력하세요"
                            value={formData.nickname}
                            onChange={handleChange}
                            autoComplete="nickname"/> {
                            errors.nickname && (
                                <div className={styles.errorMessage}>{errors.nickname}</div>
                            )
                        }
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>이메일</label>
                        <input
                            type="email"
                            name="email"
                            className={`${styles.formInput} ${errors.email
                                ? styles.error
                                : ''}`}
                            placeholder="이메일을 입력하세요"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"/> {errors.email && (<div className={styles.errorMessage}>{errors.email}</div>)}
                    </div>

                    <button type="submit" className={styles.submitButton} disabled={loading}>
                        {
                            loading
                                ? (<> < div className = {
                                    styles.spinner
                                } > </div>회원가입 중 ...</>)
                                : (<> ✨ 회원가입</>)
                        }
                    </button>
                </form>

                <div className={styles.loginLink}>
                    <p>
                        이미 계정이 있으신가요?{' '}
                        <RouterLink to="/login">로그인하기</RouterLink>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RegisterForm;
