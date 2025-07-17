// src/components/Schedule/ScheduleForm.jsx
import { useState } from 'react';
import styles from '../../styles/ScheduleForm.module.scss';
import { notifySuccess, notifyError } from '../../utils/notify';

export default function ScheduleForm({ onAdd }) {
  const [form, setForm] = useState({ title: '', date: '', desc: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFiles([...e.target.files]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      notifyError('로그인 후 작성 가능');
      setLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('date', form.date);
    formData.append('desc', form.desc);
    files.forEach(file => formData.append('images', file));
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        notifySuccess('일정 등록 성공');
        setForm({ title: '', date: '', desc: '' });
        setFiles([]);
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
      <input className={styles.input} name="title" placeholder="일정 제목" value={form.title} onChange={handleChange} required maxLength={50} disabled={loading} />
      <input className={styles.input} type="date" name="date" value={form.date} onChange={handleChange} required disabled={loading} />
      <input className={styles.input} name="desc" placeholder="설명" value={form.desc} onChange={handleChange} maxLength={100} disabled={loading} />
      <input className={styles.input} type="file" name="images" accept="image/*" multiple onChange={handleFileChange} disabled={loading} />
      {files.length > 0 && (
        <div className={styles.imgPreviewWrap}>
          {Array.from(files).map((file, idx) => (
            <img key={idx} src={URL.createObjectURL(file)} alt="미리보기" className={styles.imgPreview} />
          ))}
        </div>
      )}
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? '로딩 중...' : '등록'}
      </button>
    </form>
  );
}
