import { toast } from 'react-toastify';

// 공통 토스트 설정
const defaultConfig = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// 성공 알림
export const notifySuccess = (message, config = {}) => {
  toast.success(message, { ...defaultConfig, ...config });
};

// 에러 알림
export const notifyError = (message, config = {}) => {
  toast.error(message, { ...defaultConfig, autoClose: 5000, ...config });
};

// 정보 알림
export const notifyInfo = (message, config = {}) => {
  toast.info(message, { ...defaultConfig, ...config });
};

// 경고 알림
export const notifyWarning = (message, config = {}) => {
  toast.warning(message, { ...defaultConfig, ...config });
};

// 로딩 알림 (Promise 기반)
export const notifyPromise = (promise, messages, config = {}) => {
  return toast.promise(
    promise,
    {
      pending: messages.pending || '처리 중...',
      success: messages.success || '완료되었습니다!',
      error: messages.error || '오류가 발생했습니다.',
    },
    { ...defaultConfig, ...config }
  );
};

// 사용자 정의 알림
export const notifyCustom = (content, config = {}) => {
  toast(content, { ...defaultConfig, ...config });
};

// 모든 토스트 닫기
export const dismissAll = () => {
  toast.dismiss();
};
