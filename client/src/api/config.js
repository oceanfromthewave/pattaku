// src/api/apiConfig.js
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const UPLOADS_URL =
  import.meta.env.VITE_UPLOADS_URL || "http://localhost:5000/uploads";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000";

export { API_BASE_URL, UPLOADS_URL, WS_URL };
