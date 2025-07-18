import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import styles from '../../styles/EditPostForm.module.scss';
import { notifySuccess, notifyError } from '../../utils/notify';

export default function EditPostForm() {
  const { postId } = useParams();
  const [form, setForm] = useState({ title: '', content: '' });
  const [files, setFiles] = useState([]); // 새로 추가된 파일들
  const [originFiles, setOriginFiles] = useState([]); // 기존 첨부파일
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // 게시글과 수정 내역 불러오기
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/posts/${postId}`).then(res => {
        if (!res.ok) throw new Error('게시글을 불러오지 못했습니다.');
        return res.json();
      }),
      fetch(`/api/posts/${postId}/history`).then(res => (res.ok ? res.json() : [])),
    ])
      .then(([data, historyData]) => {
        setForm({ title: data.title, content: data.content });
        setOriginFiles(data.files || []);
        setHistory(historyData);
      })
      .catch(err => {
        notifyError(err.message || '불러오기 실패');
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [postId, navigate]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));
  const removeOriginFile = (idx) => setOriginFiles(originFiles.filter((_, i) => i !== idx));

  // 이미지 및 파일 미리보기
  const renderFilePreview = (file) => {
    if (!file) return null;
    if (file.type && file.type.startsWith('image/')) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt="첨부이미지"
          className={styles.previewImg}
          onLoad={e => URL.revokeObjectURL(e.target.src)}
        />
      );
    }
    return <div className={styles.previewFile}>{file.name}</div>;
  };

  const renderOriginFilePreview = (file, idx) => {
    if (file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return (
        <div className={styles.previewOriginBox} key={file.url}>
          <img src={file.url} alt="첨부이미지" className={styles.previewImg} />
          <button type="button" className={styles.delBtn} onClick={() => removeOriginFile(idx)}>×</button>
        </div>
      );
    }
    return (
      <div className={styles.previewOriginBox} key={file.url}>
        <a href={file.url} download className={styles.previewFile}>{file.name || '첨부파일'}</a>
        <button type="button" className={styles.delBtn} onClick={() => removeOriginFile(idx)}>×</button>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      // 이미지 압축
      const compressedFiles = await Promise.all(
        files.map(file =>
          file.type?.startsWith('image/')
            ? imageCompression(file, { maxSizeMB: 0.7, maxWidthOrHeight: 1400, useWebWorker: true })
            : file
        )
      );

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);

      compressedFiles.forEach(f => formData.append('files', f));
      formData.append('remain_files', JSON.stringify(originFiles.map(f => f.name)));

      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
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

  // 수정 내역 복구
  const handleRestoreHistory = (hist) => {
    if (!window.confirm('이전 내용으로 복구하시겠습니까?')) return;
    setForm({ title: hist.title, content: hist.content });
  };

  return (
    <form className={styles.postForm} onSubmit={handleSubmit}>
      <h3>게시글 수정</h3>
      <div className={styles.labelWrap}>
        <label htmlFor="title">제목</label>
        <input
          id="title"
          name="title"
          className={styles.input}
          placeholder="제목"
          value={form.title}
          onChange={handleChange}
          required
          maxLength={100}
          disabled={loading}
        />
      </div>
      <div className={styles.labelWrap}>
        <label htmlFor="content">내용</label>
        <textarea
          id="content"
          name="content"
          className={styles.textarea}
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
        <input
          type="file"
          multiple
          accept="image/*, .pdf,.xlsx,.xls,.doc,.docx,.hwp,.txt"
          onChange={handleFiles}
          ref={fileInputRef}
          disabled={loading}
          className={styles.fileInput}
        />
        <div className={styles.previewWrap}>
          {originFiles.map(renderOriginFilePreview)}
          {files.map((file, idx) => (
            <div key={idx} className={styles.previewNewBox}>
              {renderFilePreview(file)}
              <button type="button" className={styles.delBtn} onClick={() => removeFile(idx)}>×</button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? '수정 중...' : '수정하기'}
      </button>

      {history.length > 0 && (
        <div className={styles.historyBox}>
          <strong>수정 내역</strong>
          <ul>
            {history.map(hist => (
              <li key={hist.id} className={styles.histItem}>
                <span>[{new Date(hist.updated_at).toLocaleString()}] {hist.editor_nickname || hist.editor}</span>
                <button
                  type="button"
                  className={styles.restoreBtn}
                  onClick={() => handleRestoreHistory(hist)}
                >
                  복구
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
