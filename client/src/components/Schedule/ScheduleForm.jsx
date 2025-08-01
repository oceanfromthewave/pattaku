import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { createSchedule } from '../../api/scheduleApi';
import { notifySuccess, notifyError } from '../../utils/notify';
import imageCompression from 'browser-image-compression';
import styles from '../../styles/ScheduleForm.module.scss';

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
    <div key={i} className={styles.previewBox}>
      <img
        src={URL.createObjectURL(file)}
        alt={`미리보기${i + 1}`}
        className={styles.previewImg}
        onLoad={e => URL.revokeObjectURL(e.target.src)}
      />
      <div className={styles.fileDetails}>
        <div className={styles.fileName}>{file.name}</div>
        <div className={styles.fileSize}>
          {(file.size / 1024 / 1024).toFixed(1)}MB
        </div>
      </div>
      <button
        type="button"
        onClick={() => removeImg(i)}
        className={styles.delBtn}
        aria-label="이미지 삭제"
        disabled={loading}
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
      // 이미지 압축/리사이즈 후 항상 File 객체로 변환!
      const compressed = await Promise.all(
        images.map(async (file) => {
          const blob = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1400,
            useWebWorker: true,
          });
          // 확장자 고정 및 이름 중복 방지
          const ext = file.name.split('.').pop();
          const filename = `${file.name.replace(/\.[^/.]+$/, '')}_${Date.now()}.${ext}`;
          return new File([blob], filename, { type: blob.type });
        })
      );

      // 파일 검증 (모든 요소가 File)
      compressed.forEach(f => {
        if (!(f instanceof File)) {
          console.error("압축 결과 File이 아님:", f);
          throw new Error("파일 압축에 실패했습니다.");
        }
      });

      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('date', form.date);
      formData.append('desc', form.desc.trim());
      // images 필드로 첨부
      compressed.forEach(f => formData.append('images', f));

      // ★ API 함수에서 headers 자동 처리! 별도 지정 X
      await createSchedule(formData);

      notifySuccess('일정이 성공적으로 등록되었습니다! 🎉');
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
    <div className={styles.scheduleFormRoot}>
      <div className={styles.formCard}>
        {/* 헤더 */}
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>📅 새 일정 등록</h1>
          <p className={styles.formSubtitle}>다함께 참여할 일정을 만들어보세요</p>
        </div>
        {/* 폼 */}
        <div className={styles.formBody}>
          <form onSubmit={handleSubmit}>
            {/* 일정 제목 */}
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.formLabel}>일정 제목</label>
              <input
                id="title"
                className={styles.formInput}
                name="title"
                placeholder="일정 제목을 입력하세요"
                value={form.title}
                onChange={handleChange}
                required
                maxLength={50}
                disabled={loading}
              />
              <div className={styles.charCount}>
                {form.title.length}/50
              </div>
            </div>
            {/* 일정 날짜 */}
            <div className={styles.formGroup}>
              <label htmlFor="date" className={styles.formLabel}>일정 날짜</label>
              <input
                id="date"
                className={styles.formInput}
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                min={minDate}
                required
                disabled={loading}
              />
              <div className={styles.fieldHint}>
                오늘 이후의 날짜를 선택하세요
              </div>
            </div>
            {/* 일정 설명 */}
            <div className={styles.formGroup}>
              <label htmlFor="desc" className={styles.formLabel}>일정 설명</label>
              <textarea
                id="desc"
                className={styles.formTextarea}
                name="desc"
                placeholder="일정에 대한 상세 설명을 입력하세요"
                value={form.desc}
                onChange={handleChange}
                maxLength={200}
                rows={4}
                required
                disabled={loading}
              />
              <div className={styles.charCount}>
                {form.desc.length}/200
              </div>
            </div>
            {/* 이미지 첨부 */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>이미지 첨부 (선택사항)</label>
              <div
                className={classNames(styles.attachBox, {
                  [styles.dragOver]: dragOver
                })}
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
                  className={styles.fileInput}
                />
                <div className={styles.attachIcon}>🖼️</div>
                <div className={styles.attachDesc}>
                  이미지를 여기로 드래그하거나 클릭하여 선택하세요
                </div>
                <div className={styles.attachSubDesc}>
                  JPG, PNG, GIF 등 이미지 파일만 지원 (최대 10MB)
                </div>
                {images.length > 0 && (
                  <div className={styles.attachStatus}>
                    {images.length}개 이미지 선택됨
                    ({(images.reduce((acc, img) => acc + img.size, 0) / 1024 / 1024).toFixed(1)}MB)
                  </div>
                )}
              </div>
              {/* 이미지 미리보기 */}
              {images.length > 0 && (
                <div className={styles.previewWrap}>
                  {images.map(renderPreview)}
                </div>
              )}
            </div>
            {/* 버튼 그룹 */}
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={classNames('btn', styles.btnSecondary)}
                onClick={() => navigate('/schedules')}
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className={classNames('btn', styles.btnPrimary)}
                disabled={loading || !form.title.trim() || !form.date || !form.desc.trim()}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
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
  );
}
