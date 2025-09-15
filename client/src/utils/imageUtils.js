import { API_BASE_URL } from "../api/config";

/**
 * 프로필 이미지 URL을 완전한 URL로 변환
 * @param {string} imagePath - 서버에서 받은 이미지 경로 (/uploads/profiles/filename.jpg)
 * @returns {string} - 완전한 이미지 URL
 */
export const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // 개발 환경에서만 디버깅
  if (import.meta.env.DEV) {
    console.log("🖼️ 이미지 URL 변환:", {
      원본: imagePath,
      API_BASE_URL: API_BASE_URL,
    });
  }

  // 이미 완전한 URL인 경우 (http로 시작)
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // 상대 경로인 경우 (/uploads/profiles/filename.jpg)
  if (imagePath.startsWith("/")) {
    const fullUrl = `${API_BASE_URL}${imagePath}`;
    if (import.meta.env.DEV) {
      console.log("🖼️ 생성된 URL:", fullUrl);
    }
    return fullUrl;
  }

  // 기타 경우 (uploads/profiles/filename.jpg)
  const fullUrl = `${API_BASE_URL}/${imagePath}`;
  if (import.meta.env.DEV) {
    console.log("🖼️ 생성된 URL:", fullUrl);
  }
  return fullUrl;
};

/**
 * 프로필 이미지 URL 유효성 검사 및 대체 처리
 * @param {string} imagePath - 원본 이미지 경로
 * @returns {Promise<string|null>} - 유효한 이미지 URL 또는 null
 */
export const validateProfileImageUrl = async (imagePath) => {
  if (!imagePath) return null;

  const url = getProfileImageUrl(imagePath);
  if (!url) return null;

  try {
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) {
      return url;
    } else {
      if (import.meta.env.DEV) {
        console.warn(
          "⚠️ 프로필 이미지 접근 불가:",
          url,
          "Status:",
          response.status
        );
      }
      return null;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("⚠️ 프로필 이미지 검증 실패:", url, error.message);
    }
    return null;
  }
};

/**
 * 이미지 로드 오류 시 기본 이미지 또는 플레이스홀더 반환
 * @param {string} imagePath - 원본 이미지 경로
 * @returns {string} - 대체 이미지 URL 또는 null
 */
export const getImageUrlWithFallback = (imagePath) => {
  const url = getProfileImageUrl(imagePath);
  return url;
};

/**
 * 이미지 URL 유효성 검사
 * @param {string} imagePath - 검사할 이미지 경로
 * @returns {boolean} - 유효한 이미지 경로인지 여부
 */
export const isValidImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return false;

  // 허용되는 이미지 확장자
  const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const lowerPath = imagePath.toLowerCase();

  return validExtensions.some((ext) => lowerPath.includes(ext));
};
