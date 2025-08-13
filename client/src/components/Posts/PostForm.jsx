import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../../api/postApi';
import { notifySuccess, notifyError, notifyPromise } from '../../utils/notify';
import AIAssistant from '../AI/AIAssistant';
import imageCompression from 'browser-image-compression';
import styles from '../../styles/PostForm.module.scss';

export default function PostForm() {
  const [form, setForm] = useState({ title: '', content: '', tags: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // AI 제안 처리
  const handleAISuggestion = (type, data) => {
    switch (type) {
      case 'addTag':
        // 태그 추가
        const currentTags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(t => t) : [];
        if (!currentTags.includes(data)) {
          const newTags = [...currentTags, data].join(', ');
          setForm(prev => ({ ...prev, tags: newTags }));
          notifySuccess(`태그 "${data}" 추가됨`);
        }
        break;
      case 'summarize':
        // 요약문을 제목에 제안 (사용자가 선택)
        if (window.confirm('AI 요약을 제목으로 사용하시겠습니까?')) {
          setForm(prev => ({ ...prev, title: data.summary }));
        }
        break;
      default:
        console.log('AI 제안:', type, data);
    }
  };

  // AI 업데이트 처리
  const handleAIUpdate = (newContent) => {
    setForm(prev => ({ ...prev, content: newContent }));
    notifySuccess('AI가 내용을 업데이트했습니다');
  };

  // 파일 추가
  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);

    // 파일 크기 체크 (10MB 제한)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = fileArray.filter((file) => {
      if (file.size > maxSize) {
        notifyError(`${file.name}은(는) 10MB를 초과합니다.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      notifySuccess(`${validFiles.length}개 파일이 추가되었습니다.`);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  const removeFile = (idx) => {
    setFiles(files.filter((_, i) => i !== idx));
    notifySuccess('파일이 제거되었습니다.');
  };

  // 파일 미리보기
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
    return (
      <div className={styles.previewFile}>
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
      
      // 태그 추가
      if (form.tags.trim()) {
        const tagsArray = form.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        formData.append('tags', JSON.stringify(tagsArray));
      }
      
      compressedFiles.forEach(f => formData.append('files', f));

      await notifyPromise(
        createPost(formData),
        {
          pending: '글을 등록하는 중...',
          success: '글이 성공적으로 등록되었습니다! 🎉',
          error: '글 등록에 실패했습니다.'
        }
      );

      setForm({ title: '', content: '', tags: '' });
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      navigate('/posts');
    } catch (error) {
      console.error('글 등록 실패:', error);
      notifyError(error.response?.data?.error || '네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.postFormRoot}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>✍️ 새 글 작성</h2>
          <p className={styles.formSubtitle}>다른 사람들과 생각을 공유해보세요</p>
          
          {/* AI 토글 버튼 */}
          <div className={styles.aiToggle}>
            <button
              type="button"
              className={`${styles.aiToggleBtn} ${showAI ? styles.active : ''}`}
              onClick={() => setShowAI(!showAI)}
            >
              🤖 AI 어시스턴트 {showAI ? '끄기' : '켜기'}
            </button>
          </div>
        </div>

        <form className={styles.formBody} onSubmit={handleSubmit}>
          {/* 제목 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>제목</label>
            <input
              className={styles.formInput}
              name="title"
              placeholder="제목을 입력하세요"
              value={form.title}
              onChange={handleChange}
              autoComplete="off"
              required
              maxLength={100}
              disabled={loading}
            />
            <div className={styles.charCount}>{form.title.length}/100</div>
          </div>

          {/* 내용 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>내용</label>
            <textarea
              className={styles.formTextarea}
              name="content"
              placeholder="내용을 입력하세요"
              value={form.content}
              onChange={handleChange}
              rows={8}
              required
              disabled={loading}
              maxLength={3000}
            />
            <div className={styles.charCount}>{form.content.length}자</div>
          </div>

          {/* 태그 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>태그 (선택사항)</label>
            <input
              className={styles.formInput}
              name="tags"
              placeholder="태그를 쉼표로 구분하여 입력하세요 (예: React, JavaScript, 개발)"
              value={form.tags}
              onChange={handleChange}
              autoComplete="off"
              disabled={loading}
            />
            <div className={styles.tagHelp}>
              💡 AI 어시스턴트가 내용을 분석하여 태그를 추천해드립니다
            </div>
          </div>

          {/* AI 어시스턴트 */}
          {showAI && (
            <AIAssistant
              content={form.content}
              title={form.title}
              onSuggestion={handleAISuggestion}
              onUpdate={handleAIUpdate}
              disabled={loading}
            />
          )}

          {/* 파일 첨부 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>파일 첨부</label>
            <div
              className={`${styles.attachBox} ${dragOver ? styles.dragOver : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.xlsx,.xls,.doc,.docx,.hwp,.txt"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={loading}
                className={styles.fileInput}
              />
              <div className={styles.attachIcon}>📎</div>
              <div className={styles.attachDesc}>파일을 드래그하거나 클릭해 선택</div>
              <div className={styles.attachSubDesc}>
                이미지, PDF, 문서 파일 지원 (최대 10MB)
              </div>
              {files.length > 0 && (
                <div className={styles.attachStatus}>
                  {files.length === 1
                    ? files[0].name
                    : `${files[0].name} 외 ${files.length - 1}개`
                  } ({(files.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(1)}MB)
                </div>
              )}
            </div>

            {/* 미리보기 */}
            {files.length > 0 && (
              <div className={styles.previewWrap}>
                {files.map((f, idx) => (
                  <div key={idx} className={styles.previewBox}>
                    {renderFilePreview(f)}
                    <div className={styles.fileDetails}>
                      <div className={styles.fileName}>
                        {f.name.length > 25 ? f.name.slice(0, 22) + '...' : f.name}
                      </div>
                      <div className={styles.fileSize}>
                        {(f.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.delBtn}
                      onClick={e => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
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

          {/* 버튼 */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate('/posts')}
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading || !form.title.trim() || !form.content.trim()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  등록 중...
                </>
              ) : (
                <>✅ 글 등록</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
