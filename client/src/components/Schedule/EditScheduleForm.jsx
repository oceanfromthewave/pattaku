import {useParams, useNavigate} from 'react-router-dom';
import {useState, useEffect, useRef} from 'react';
import {getScheduleById, updateSchedule} from '../../api/scheduleApi';
import {notifySuccess, notifyError} from '../../utils/notify';
import {UPLOADS_URL} from '../../api/config';
import Loading from '../Loading';
import styles from '../../styles/ScheduleForm.module.scss';

export default function EditScheduleForm() {
    const {scheduleId} = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [schedule, setSchedule] = useState(null);

    const [formData, setFormData] = useState({title: '', desc: ''});

    const [files, setFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    // 초기 데이터 로드
    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoading(true);
                const data = await getScheduleById(scheduleId);

                // 권한 확인
                const userId = localStorage.getItem('userId');
                const username = localStorage.getItem('username');

                const isAuthor = (
                    String(data.user_id) === String(userId) || data.author === username
                );

                if (!isAuthor) {
                    notifyError('수정 권한이 없습니다.');
                    navigate(`/schedules/${scheduleId}`);
                    return;
                }

                setSchedule(data);
                setFormData({
                    title: data.title || '',
                    desc: data.desc || ''
                });
                setExistingImages(data.images || []);
            } catch (error) {
                console.error('일정 로드 오류:', error);
                notifyError('일정 정보를 불러올 수 없습니다.');
                navigate('/schedules');
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [scheduleId, navigate]);

    // 폼 데이터 변경 처리
    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // 파일 선택 처리
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = selectedFiles.filter(file => {
            const isValidType = file
                .type
                .startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

            if (!isValidType) {
                notifyError(`${file.name}: 이미지 파일만 업로드 가능합니다.`);
                return false;
            }
            if (!isValidSize) {
                notifyError(`${file.name}: 파일 크기는 5MB 이하여야 합니다.`);
                return false;
            }
            return true;
        });

        setFiles(validFiles);
    };

    // 기존 이미지 삭제
    const removeExistingImage = (index) => {
        setExistingImages(existingImages.filter((_, i) => i !== index));
    };

    // 새 이미지 삭제
    const removeNewFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    // 폼 제출
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            notifyError('제목을 입력해주세요.');
            return;
        }

        try {
            setSubmitting(true);

            const submitData = new FormData();
            submitData.append('title', formData.title.trim());
            submitData.append('desc', formData.desc.trim());

            // 기존 이미지 정보 전송
            submitData.append('existingImages', JSON.stringify(existingImages));

            // 새 파일들 추가
            files.forEach(file => {
                submitData.append('images', file);
            });

            await updateSchedule(scheduleId, submitData);

            notifySuccess('일정이 수정되었습니다.');
            navigate(`/schedules/${scheduleId}`);
        } catch (error) {
            console.error('일정 수정 오류:', error);
            notifyError(error.message || '일정 수정에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <Loading message="일정 정보를 불러오는 중..."/>;
    }

    if (!schedule) {
        return (
            <div className={styles.scheduleFormRoot}>
                <div className={styles.card}>
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>📅</div>
                        <h2>일정을 찾을 수 없습니다</h2>
                        <button className={styles.btnPrimary} onClick={() => navigate('/schedules')}>
                            ← 일정 목록으로
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.scheduleFormRoot}>
            <div className={styles.card}>
                <div className={styles.formHeader}>
                    <h1 className={styles.formTitle}>
                        ✏️ 일정 수정
                    </h1>
                    <p className={styles.formSubtitle}>
                        일정 정보를 수정해주세요
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.scheduleForm}>
                    {/* 제목 입력 */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            제목
                            <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={styles.formInput}
                            placeholder="일정 제목을 입력하세요"
                            disabled={submitting}
                            required="required"/>
                    </div>

                    {/* 설명 입력 */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>설명</label>
                        <textarea
                            name="desc"
                            value={formData.desc}
                            onChange={handleInputChange}
                            className={styles.formTextarea}
                            placeholder="일정에 대한 자세한 설명을 입력하세요 (선택사항)"
                            rows={6}
                            disabled={submitting}/>
                    </div>

                    {/* 기존 이미지 */}
                    {
                        existingImages.length > 0 && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>기존 이미지</label>
                                <div className={styles.existingImages}>
                                    {
                                        existingImages.map((img, index) => (
                                            <div key={index} className={styles.imagePreview}>
                                                <img
                                                    src={img.startsWith('http')
                                                        ? img
                                                        : `${UPLOADS_URL}/${img.replace(/^\/?uploads\/?/, '')}`}
                                                    alt={`기존 이미지 ${index + 1}`}
                                                    className={styles.previewImage}/>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingImage(index)}
                                                    className={styles.removeImageBtn}
                                                    disabled={submitting}>
                                                    ✕
                                                </button>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )
                    }

                    {/* 새 이미지 업로드 */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            새 이미지 추가 (선택사항)
                        </label>
                        <div className={styles.fileUploadArea}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple="multiple"
                                accept="image/*"
                                onChange={handleFileChange}
                                className={styles.fileInput}
                                disabled={submitting}/>
                            <button
                                type="button"
                                onClick={(
                                    ) => fileInputRef.current
                                    ?.click()}
                                className={styles.fileUploadBtn}
                                disabled={submitting}>
                                📷 이미지 선택
                            </button>
                            <div className={styles.fileUploadHint}>
                                • 최대 5MB, 이미지 파일만 가능 • 여러 파일 선택 가능
                            </div>
                        </div>

                        {/* 새 파일 미리보기 */}
                        {
                            files.length > 0 && (
                                <div className={styles.newFilesPreviews}>
                                    <h4>새로 추가할 이미지:</h4>
                                    <div className={styles.fileList}>
                                        {
                                            files.map((file, index) => (
                                                <div key={index} className={styles.fileItem}>
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`새 이미지 ${index + 1}`}
                                                        className={styles.previewImage}/>
                                                    <div className={styles.fileInfo}>
                                                        <span className={styles.fileName}>{file.name}</span>
                                                        <span className={styles.fileSize}>
                                                            ({(file.size / 1024 / 1024).toFixed(2)}MB)
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewFile(index)}
                                                        className={styles.removeFileBtn}
                                                        disabled={submitting}>
                                                        ✕
                                                    </button>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            )
                        }
                    </div>

                    {/* 제출 버튼 */}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            onClick={() => navigate(`/schedules/${scheduleId}`)}
                            className={styles.btnSecondary}
                            disabled={submitting}>
                            취소
                        </button>
                        <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                            {
                                submitting
                                    ? '수정 중...'
                                    : '✏️ 수정 완료'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
