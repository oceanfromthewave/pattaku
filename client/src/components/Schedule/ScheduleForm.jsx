// src/components/Schedule/ScheduleForm.jsx
import { useState } from 'react';
import { notifySuccess, notifyError } from '../../utils/notify';
import styles from '../../styles/ScheduleForm.module.scss';

export default function ScheduleForm({ onAdd }) {
  const [form, setForm] = useState({ title: '', date: '', desc: '' });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      notifyError('로그인 후 작성 가능');
      setLoading(false);
      return;
    }
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('date', form.date);
      fd.append('desc', form.desc);
      images.forEach(file => fd.append('images', file));

      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        notifySuccess('일정 등록 성공');
        setForm({ title: '', date: '', desc: '' });
        setImages([]);
        if (onAdd) onAdd();
      } else {
        notifyError(data.error || '등록 실패');
      }
    } catch (err) {
      notifyError('네트워크 오류');
    }
    setLoading(false);
  };

  return (
    <form className={styles.scheduleForm} onSubmit={handleSubmit}>
      <h3 className={styles.title}>일정 등록</h3>
      <input
        className={styles.input}
        name="title"
        placeholder="일정 제목"
        value={form.title}
        onChange={handleChange}
        required
        maxLength={50}
        disabled={loading}
      />
      <input
        className={styles.input}
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        required
        disabled={loading}
      />
      <input
        className={styles.input}
        name="desc"
        placeholder="설명"
        value={form.desc}
        onChange={handleChange}
        maxLength={100}
        disabled={loading}
      />
      <input
        className={styles.input}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
      />
      {images.length > 0 && (
        <div className={styles.preview}>
          {Array.from(images).map((file, i) => (
            <span key={i}>{file.name}</span>
          ))}
        </div>
      )}
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? '로딩 중...' : '등록'}
      </button>
    </form>
  );
}
