let showModalFunc = null;

// App.js에서 연결할 때 사용
export function setShowTokenExpireModal(fn) {
  showModalFunc = fn;
}

// ✅ 모든 /api/... 요청에 VITE_API_URL 자동으로 붙이기!
const apiUrl = import.meta.env.VITE_API_URL;

export default async function authFetch(url, options) {
  // url이 절대경로인지 확인 후, 상대경로면 API_URL 붙임
  const finalUrl = url.startsWith("http")
    ? url
    : url.startsWith("/")
    ? `${apiUrl}${url}`
    : `${apiUrl}/${url}`;

  const res = await fetch(finalUrl, options);
  if (res.status === 401) {
    if (showModalFunc) showModalFunc();
    throw new Error("토큰 만료");
  }
  return res;
}
