import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSchedule } from '../../api/scheduleApi';
import { notifySuccess, notifyError } from '../../utils/notify';
import imageCompression from 'browser-image-compression';

export default function ScheduleForm() {
  const [form, setForm] = useState({ title: '', date: '', desc: '' });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  // 입력값 처리
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 파일 선택/추가
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    
    // 이미지 파일만 필터링
    const imageFiles = selected.filter(file => {
      if (!file.type.startsWith('image/')) {
        notifyError(`${file.name}은(는) 이미지 파일이 아닙니다.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        notifyError(`${file.name}은(는) 10MB를 초과합니다.`);
        return false;
      }
      return true;
    });
    
    if (imageFiles.length > 0) {
      setImages((prev) => [...prev, ...imageFiles]);
      notifySuccess(`${imageFiles.length}개 이미지가 추가되었습니다.`);
    }
    
    if (fileRef.current) fileRef.current.value = '';
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
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  // 이미지 삭제
  const removeImg = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
    notifySuccess('이미지가 제거되었습니다.');
  };

  // 이미지 미리보기
  const renderPreview = (file, i) => (
    <div key={i} style={{
      position: 'relative',
      width: '120px',
      height: '120px',
      borderRadius: 'var(--border-radius-md)',
      overflow: 'hidden',
      border: '1px solid var(--border-color)'
    }}>
      <img 
        src={URL.createObjectURL(file)} 
        alt={`미리보기${i+1}`} 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        onLoad={e => URL.revokeObjectURL(e.target.src)} 
      />
      <button 
        type="button" 
        onClick={() => removeImg(i)} 
        aria-label="이미지 삭제"
        style={{
          position: 'absolute',
          top: 'var(--spacing-xs)',
          right: 'var(--spacing-xs)',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: 'none',
          background: 'var(--error)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'bold'
        }}
      >
        ×
      </button>
    </div>
  );

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.date || !form.desc.trim()) {
      notifyError('모든 필드를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      notifyError('로그인 후 작성 가능합니다.');
      setLoading(false);
      return;
    }
    
    try {
      // 이미지 압축/리사이즈
      const compressed = await Promise.all(
        images.map(async (file) => {
          const blob = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1400,
            useWebWorker: true,
          });
          return new File([blob], file.name, { type: blob.type });
        })
      );

      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('date', form.date);
      formData.append('desc', form.desc.trim());
      compressed.forEach(f => formData.append('images', f));

      await createSchedule(formData);
      
      notifySuccess('일정이 성공적으로 등록되었습니다! 🎉');
      
      // 폼 초기화 후 목록으로 이동
      setForm({ title: '', date: '', desc: '' });
      setImages([]);
      if (fileRef.current) fileRef.current.value = '';
      
      navigate('/schedules');
      
    } catch (error) {
      console.error('일정 등록 실패:', error);
      notifyError(error.response?.data?.error || '일정 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 내일 날짜를 기본값으로 설정
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="page-container">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📅 새 일정 등록</h2>
            <p className="card-subtitle">다함께 참여할 일정을 만들어보세요</p>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* 일정 제목 */}
              <div className="form-group">
                <label className="form-label">일정 제목</label>
                <input
                  className="form-input"
                  name="title"
                  placeholder="일정 제목을 입력하세요"
                  value={form.title}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  disabled={loading}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  marginTop: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-muted)'
                }}>
                  {form.title.length}/50
                </div>
              </div>

              {/* 일정 날짜 */}
              <div className="form-group">
                <label className="form-label">일정 날짜</label>
                <input
                  className="form-input"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  min={minDate}
                  required
                  disabled={loading}
                />
                <div style={{ 
                  marginTop: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-muted)'
                }}>
                  오늘 이후의 날짜를 선택하세요
                </div>
              </div>

              {/* 일정 설명 */}
              <div className="form-group">
                <label className="form-label">일정 설명</label>
                <textarea
                  className="form-textarea"
                  name="desc"
                  placeholder="일정에 대한 상세 설명을 입력하세요"
                  value={form.desc}
                  onChange={handleChange}
                  maxLength={200}
                  rows={4}
                  required
                  disabled={loading}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  marginTop: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-muted)'
                }}>
                  {form.desc.length}/200
                </div>
              </div>

              {/* 이미지 첨부 */}
              <div className="form-group">
                <label className="form-label">이미지 첨부 (선택사항)</label>
                <div 
                  style={{
                    border: dragOver ? '2px dashed var(--primary-500)' : '2px dashed var(--border-color)',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: 'var(--spacing-xl)',
                    textAlign: 'center',
                    background: dragOver ? 'var(--primary-50)' : 'var(--bg-secondary)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer'
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileRef}
                    disabled={loading}
                    style={{ display: 'none' }}
                  />
                  
                  <div style={{ 
                    fontSize: 'var(--font-size-2xl)', 
                    marginBottom: 'var(--spacing-sm)',
                    color: 'var(--text-muted)'
                  }}>
                    🖼️
                  </div>
                  <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                    이미지를 여기로 드래그하거나 클릭하여 선택하세요
                  </p>
                  <p style={{ 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--text-muted)' 
                  }}>
                    JPG, PNG, GIF 등 이미지 파일만 지원 (최대 10MB)
                  </p>
                  
                  {images.length > 0 && (
                    <div style={{ 
                      marginTop: 'var(--spacing-md)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      {images.length}개 이미지 선택됨 
                      ({(images.reduce((acc, img) => acc + img.size, 0) / 1024 / 1024).toFixed(1)}MB)
                    </div>
                  )}
                </div>
                
                {/* 이미지 미리보기 */}
                {images.length > 0 && (
                  <div style={{ 
                    marginTop: 'var(--spacing-md)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-md)'
                  }}>
                    {images.map(renderPreview)}
                  </div>
                )}
              </div>
              
              {/* 버튼 그룹 */}
              <div style={{ 
                display: 'flex', 
                gap: 'var(--spacing-sm)', 
                justifyContent: 'flex-end',
                marginTop: 'var(--spacing-xl)' 
              }}>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/schedules')}
                  disabled={loading}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading || !form.title.trim() || !form.date || !form.desc.trim()}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid currentColor',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></span>
                      등록 중...
                    </>
                  ) : (
                    <>📅 일정 등록</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
