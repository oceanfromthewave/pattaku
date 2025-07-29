import { useState, useRef } from 'react';
import { createPost } from '../../api/postApi';
import { notifySuccess, notifyError, notifyPromise } from '../../utils/notify';
import imageCompression from 'browser-image-compression';
import classNames from 'classnames';
import styles from '../../styles/PostForm.module.scss';

export default function PostForm({ onPost }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [files, setFiles] = useState([]); // 첨부파일
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 파일 추가
  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    // 파일 크기 체크 (10MB 제한)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize) {
        notifyError(`${file.name}은(는) 10MB를 초과합니다.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      notifySuccess(`${validFiles.length}개 파일이 추가되었습니다.`);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 파일 선택 이벤트
  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // 드래그 앤 드롭 이벤트
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // 파일 삭제
  const removeFile = (idx) => {
    setFiles(files.filter((_, i) => i !== idx));
    notifySuccess('파일이 제거되었습니다.');
  };

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
        📎 {file.name}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.content.trim()) {
      notifyError('제목과 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      // 이미지 압축 처리
      const compressedFiles = await Promise.all(
        files.map(file =>
          file.type?.startsWith('image/')
            ? imageCompression(file, { 
                maxSizeMB: 0.7, 
                maxWidthOrHeight: 1400, 
                useWebWorker: true 
              }).then(blob => new File([blob], file.name, { type: blob.type }))
            : file
        )
      );

      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('content', form.content.trim());
      compressedFiles.forEach((f) => formData.append('files', f));

      // Promise를 이용한 로딩 토스트
      await notifyPromise(
        createPost(formData),
        {
          pending: '글을 등록하는 중...',
          success: '글이 성공적으로 등록되었습니다! 🎉',
          error: '글 등록에 실패했습니다.'
        }
      );

      // 폼 초기화
      setForm({ title: '', content: '' });
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // 목록 새로고침
      if (onPost) onPost();
      
    } catch (error) {
      console.error('글 등록 실패:', error);
      notifyError(error.response?.data?.error || '네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={classNames(styles.postForm, 'postForm')} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <h3 className={styles.h3}>✍️ 새 글 작성</h3>
        <div className={styles.formStats}>
          <span className={styles.charCount}>
            {form.title.length}/100
          </span>
        </div>
      </div>
      
      <div className={styles.labelWrap}>
        <input
          className={styles.input}
          name="title"
          placeholder="제목을 입력하세요"
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
          placeholder="내용을 입력하세요"
          value={form.content}
          onChange={handleChange}
          rows={8}
          required
          disabled={loading}
        />
        <div className={styles.textareaStats}>
          <span className={styles.charCount}>
            {form.content.length}자
          </span>
        </div>
      </div>
      
      <div 
        className={classNames(styles.attachWrap, {
          [styles.dragOver]: dragOver
        })}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.fileInputArea}>
          <label className={styles.fileInputBtn} tabIndex={0}>
            📎 파일 선택
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.xlsx,.xls,.doc,.docx,.hwp,.txt"
              onChange={handleFileSelect}
              ref={fileInputRef}
              disabled={loading}
              className={styles.fileInput}
              tabIndex={-1}
            />
          </label>
          <div className={styles.dragInfo}>
            또는 파일을 여기로 드래그하세요
          </div>
        </div>
        
        <div className={styles.fileInfo}>
          <div className={styles.fileNameBox}>
            {files.length === 0
              ? "선택된 파일 없음"
              : files.length === 1
                ? files[0].name
                : `${files[0].name} 외 ${files.length - 1}개`}
          </div>
          {files.length > 0 && (
            <div className={styles.fileSize}>
              총 {(files.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(1)}MB
            </div>
          )}
        </div>
        
        {files.length > 0 && (
          <div className={styles.previewWrap}>
            {files.map((f, idx) => (
              <div key={idx} className={styles.previewBox}>
                {renderFilePreview(f, idx)}
                <div className={styles.fileDetails}>
                  <span className={styles.fileName}>{f.name}</span>
                  <span className={styles.fileSize}>
                    {(f.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
                <button 
                  type="button" 
                  className={styles.delBtn} 
                  onClick={() => removeFile(idx)}
                  disabled={loading}
                  title="파일 제거"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button 
        className={classNames(styles.button, {
          [styles.loading]: loading
        })} 
        type="submit" 
        disabled={loading || !form.title.trim() || !form.content.trim()}
      >
        {loading ? (
          <>
            <span className={styles.spinner}></span>
            등록 중...
          </>
        ) : (
          '✅ 글 등록'
        )}
      </button>
    </form>
  );
}
