import { useState, useRef } from 'react';
import { notifySuccess, notifyError } from '../../utils/notify';
import imageCompression from 'browser-image-compression';
import classNames from 'classnames';
import styles from '../../styles/ScheduleForm.module.scss';

export default function ScheduleForm({ onAdd }) {
  const [form, setForm] = useState({ title: '', date: '', desc: '' });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  // 입력값 처리
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 파일 선택/추가
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setImages((prev) => [...prev, ...selected]);
    if (fileRef.current) fileRef.current.value = '';
  };

  // 이미지 삭제
  const removeImg = (idx) => setImages(images.filter((_, i) => i !== idx));

  // 이미지 미리보기
  const renderPreview = (file, i) =>
    <div key={i} className={styles.imgPreviewBox}>
      <img src={URL.createObjectURL(file)} alt={`미리보기${i+1}`} className={styles.imgPreview} onLoad={e => URL.revokeObjectURL(e.target.src)} />
      <button type="button" className={styles.imgDelBtn} onClick={() => removeImg(i)} aria-label="이미지 삭제">×</button>
    </div>;

  // 폼 제출
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
      // 이미지 압축/리사이즈
      const compressed = await Promise.all(
        images.map(file => imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1400,
          useWebWorker: true,
        }))
      );

      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('date', form.date);
      fd.append('desc', form.desc);
      compressed.forEach(f => fd.append('images', f));

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
        if (fileRef.current) fileRef.current.value = '';
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
    <form className={classNames(styles.scheduleForm, 'scheduleForm')} onSubmit={handleSubmit}>
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
      <div className={styles.fileInputWrap}>
        <input
          className={styles.fileInput}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          ref={fileRef}
          disabled={loading}
        />
      </div>
      {images.length > 0 && (
        <div className={styles.imgPreviewWrap}>
          {images.map(renderPreview)}
        </div>
      )}
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? '로딩 중...' : '등록'}
      </button>
    </form>
  );
}
