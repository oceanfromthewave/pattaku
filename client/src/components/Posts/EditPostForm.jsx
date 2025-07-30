import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import styles from '../../styles/EditPostForm.module.scss';
import { notifySuccess, notifyError } from '../../utils/notify';
import authFetch from '../../utils/authFetch';

export default function EditPostForm() {
  const { postId } = useParams();
  const [form, setForm] = useState({ title: '', content: '' });
  const [files, setFiles] = useState([]);
  const [originFiles, setOriginFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // 환경변수
  const API_SERVER = import.meta.env.VITE_API_SERVER || '';
  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || (API_SERVER + '/uploads');

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

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));
  const removeOriginFile = (idx) => setOriginFiles(originFiles.filter((_, i) => i !== idx));

  // 기존 파일 미리보기
  const renderOriginFilePreview = (file, idx) => {
    const fileUrl = file.url.startsWith('http')
      ? file.url
      : `${UPLOADS_URL}/${file.url.replace(/^\/?uploads\//, '')}`;
    if (fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return (
        <div className={styles.previewBox} key={file.url}>
          <img src={fileUrl} alt="첨부이미지" className={styles.previewImg} />
          <div className={styles.fileDetails}>
            <div className={styles.fileName}>{file.name || '첨부이미지'}</div>
          </div>
          <button type="button" className={styles.delBtn} onClick={() => removeOriginFile(idx)}>×</button>
        </div>
      );
    }
    return (
      <div className={styles.previewBox} key={file.url}>
        <a href={fileUrl} download className={styles.previewFile}>{file.name || '첨부파일'}</a>
        <div className={styles.fileDetails}>
          <div className={styles.fileName}>{file.name || '첨부파일'}</div>
        </div>
        <button type="button" className={styles.delBtn} onClick={() => removeOriginFile(idx)}>×</button>
      </div>
    );
  };

  // 새 파일 미리보기
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const compressedFiles = await Promise.all(
        files.map(file =>
          file.type?.startsWith('image/')
          ? imageCompression(file, {maxSizeMB: 0.7, maxWidthOrHeight: 1400, useWebWorker: true})
          .then(compressed =>
            new File([compressed], file.name, {type: compressed.type})
          )
          : file
        )
      );

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);

      compressedFiles.forEach(f => formData.append('files', f));
      // 남아있는 파일은 원본파일의 'name' 값(=originalname)으로
      formData.append('remain_files', JSON.stringify(originFiles.map(f => f.name)));

      const res = await authFetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        notifySuccess('게시글이 수정되었습니다!');
        navigate(`/posts/${postId}`);
      } else {
        const data = await res.json();
        notifyError(data.error || '수정에 실패했습니다.');
      }
    } catch {
      notifyError('네트워크 오류');
    }
    setLoading(false);
  };

  const handleRestoreHistory = (hist) => {
    if (!window.confirm('이전 내용으로 복구하시겠습니까?')) return;
    setForm({ title: hist.title, content: hist.content });
  };

  return (
    <div className={styles.editFormRoot}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>🛠️ 게시글 수정</h2>
        </div>
        <form className={styles.formBody} onSubmit={handleSubmit}>
          {/* 제목 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="title">제목</label>
            <input
              id="title"
              name="title"
              className={styles.formInput}
              placeholder="제목"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={100}
              disabled={loading}
            />
            <div className={styles.charCount}>{form.title.length}/100</div>
          </div>
          {/* 내용 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="content">내용</label>
            <textarea
              id="content"
              name="content"
              className={styles.formTextarea}
              placeholder="내용"
              value={form.content}
              onChange={handleChange}
              rows={8}
              required
              disabled={loading}
              maxLength={3000}
            />
            <div className={styles.charCount}>{form.content.length}자</div>
          </div>
          {/* 파일 첨부 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>파일 첨부</label>
            <input
              type="file"
              multiple
              accept="image/*, .pdf,.xlsx,.xls,.doc,.docx,.hwp,.txt"
              onChange={handleFiles}
              ref={fileInputRef}
              disabled={loading}
              className={styles.fileInput}
            />
            {/* 미리보기 */}
            {(originFiles.length > 0 || files.length > 0) && (
              <div className={styles.previewWrap}>
                {originFiles.map(renderOriginFilePreview)}
                {files.map((file, idx) => (
                  <div key={idx} className={styles.previewBox}>
                    {renderFilePreview(file)}
                    <div className={styles.fileDetails}>
                      <div className={styles.fileName}>{file.name.length > 25 ? file.name.slice(0, 22) + '...' : file.name}</div>
                    </div>
                    <button type="button" className={styles.delBtn} onClick={() => removeFile(idx)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading || !form.title.trim() || !form.content.trim()}
            >
              {loading ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
        {/* 히스토리 */}
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
      </div>
    </div>
  );
}
