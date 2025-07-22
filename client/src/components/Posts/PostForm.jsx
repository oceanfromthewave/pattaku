import { useState, useRef } from 'react';
import styles from '../../styles/PostForm.module.scss';
import imageCompression from 'browser-image-compression';
import classNames from 'classnames';
import { notifySuccess, notifyError } from '../../utils/notify';
import authFetch from '../../utils/authFetch';


export default function PostForm({ onPost }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [files, setFiles] = useState([]); // 첨부파일
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 파일 추가
  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 파일 삭제
  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));

  // 미리보기
  const renderFilePreview = (file, idx) => {
    if (!file) return null;
    if (file.type && file.type.startsWith('image/')) {
      return (
        <img
          key={idx}
          src={URL.createObjectURL(file)}
          alt="첨부이미지"
          className={styles.previewImg}
          onLoad={e => URL.revokeObjectURL(e.target.src)}
        />
      );
    }
    return (
      <div key={idx} className={styles.previewFile}>
        {file.name}
      </div>
    );
  };

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
      // *** 여기서 압축한 Blob → File로 이름 보존 ***
      const compressedFiles = await Promise.all(
        files.map(file =>
          file.type?.startsWith('image/')
            ? imageCompression(file, { maxSizeMB: 0.7, maxWidthOrHeight: 1400, useWebWorker: true })
                .then(blob => new File([blob], file.name, { type: blob.type }))
            : file
        )
      );

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      compressedFiles.forEach((f) => formData.append('files', f));

      const res = await authFetch('/api/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        notifySuccess('글이 성공적으로 등록되었습니다.');
        setForm({ title: '', content: '' });
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
    <form className={classNames(styles.postForm, 'postForm')} onSubmit={handleSubmit}>
      <h3>글 작성</h3>
      <div className={styles.labelWrap}>
        <input
          className={styles.input}
          name="title"
          placeholder="제목"
          value={form.title}
          onChange={handleChange}
          autoComplete="off"
          required
          maxLength={100}
          disabled={loading}
        />
      </div>
      <div className={styles.labelWrap}>
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
      </div>
      <div className={styles.attachWrap}>
        <label>첨부파일</label>
        <div className={styles.fileRow}>
          <label className={styles.fileInputBtn} tabIndex={0}>
            파일 선택
            <input
              type="file"
              multiple
              accept="image/*, .pdf,.xlsx,.xls,.doc,.docx,.hwp,.txt"
              onChange={handleFiles}
              ref={fileInputRef}
              disabled={loading}
              className={styles.fileInput}
              tabIndex={-1}
            />
          </label>
          <div className={styles.fileNameBox}>
            {files.length === 0
              ? "선택된 파일 없음"
              : files.length === 1
                ? files[0].name
                : `${files[0].name} 외 ${files.length - 1}개`}
          </div>
        </div>
        {files.length > 0 && (
          <div className={styles.previewWrap}>
            {files.map((f, idx) => (
              <div key={idx} className={styles.previewBox}>
                {renderFilePreview(f, idx)}
                <button type="button" className={styles.delBtn} onClick={() => removeFile(idx)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? '로딩 중...' : '등록'}
      </button>
    </form>
  );
}
