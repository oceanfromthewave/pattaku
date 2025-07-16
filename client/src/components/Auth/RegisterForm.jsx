import { useState } from "react";
import { notifySuccess, notifyError } from "../../utils/notify";
import styles from "../../styles/RegisterForm.module.scss";

export default function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({ username: "", password: "", email: "", nickname: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        notifySuccess("회원가입 성공! 로그인 해주세요.");
        setForm({ username: "", password: "", email: "", nickname: "" });
        if (onSuccess) onSuccess();
      } else {
        notifyError(data.error || "회원가입 실패");
      }
    } catch {
      notifyError("네트워크 오류");
    }
    setLoading(false);
  };

  return (
    <form className={styles.registerForm} onSubmit={handleSubmit}>
      <h3 className={styles.title}>회원가입</h3>
      <input
        className={styles.input}
        name="username"
        placeholder="아이디"
        onChange={handleChange}
        value={form.username}
        autoComplete="username"
        disabled={loading}
      />
      <input
        className={styles.input}
        name="password"
        type="password"
        placeholder="비밀번호"
        onChange={handleChange}
        value={form.password}
        autoComplete="new-password"
        disabled={loading}
      />
      <input
        className={styles.input}
        name="email"
        placeholder="이메일"
        onChange={handleChange}
        value={form.email}
        autoComplete="email"
        disabled={loading}
      />
      <input
        className={styles.input}
        name="nickname"
        placeholder="닉네임"
        onChange={handleChange}
        value={form.nickname}
        autoComplete="nickname"
        disabled={loading}
      />
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? "가입 중..." : "가입하기"}
      </button>
    </form>
  );
}
