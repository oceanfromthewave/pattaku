let showModalFunc = null;

// 이 함수는 App.js에서 내려주는 함수 연결용
export function setShowTokenExpireModal(fn) {
  showModalFunc = fn;
}

// authFetch: fetch 래퍼, 401이면 showModalFunc 호출
export default async function authFetch(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    if (showModalFunc) showModalFunc();
    throw new Error("토큰 만료");
  }
  return res;
}
