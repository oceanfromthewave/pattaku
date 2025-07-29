// API 설정 중앙 관리
const API_BASE_URL = import.meta.env.VITE_API_SERVER || 'http://localhost:5000';
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:5000/uploads';

export { API_BASE_URL, UPLOADS_URL };
