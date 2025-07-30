# 🔧 개발 및 테스트 가이드

## 🚀 빠른 시작

### 1. 서버 실행
```bash
cd server
npm run dev
```

### 2. 클라이언트 실행 (새 터미널)
```bash
cd client
npm run dev
```

### 3. 브라우저에서 확인
- **URL**: http://localhost:3000
- **서버 API**: http://localhost:5000

## ✅ 수정된 주요 이슈들

### 🔧 해결된 문제들
1. **PostAPI Export 이슈**: `getPost` 함수 추가 (getPostById의 별칭)
2. **Import 경로 수정**: 개선된 컴포넌트들의 import 경로 정리
3. **알림 시스템 연결**: Enhanced 컴포넌트들과 기존 시스템 연결
4. **다크모드 통합**: 새로운 다크모드 시스템 적용

### 📋 현재 작동 상태
- ✅ **게시글 상세 보기**: `getPost` API 함수 정상 작동
- ✅ **실시간 알림**: WebSocket 연결 및 알림 수신
- ✅ **다크모드**: 완전한 라이트/다크 모드 토글
- ✅ **반응형 UI**: 모바일, 태블릿, 데스크톱 지원
- ✅ **토스트 알림**: 성공/에러/정보 메시지 표시

## 🧪 테스트 시나리오

### 1. 기본 기능 테스트
```bash
# 1. 회원가입/로그인
- /register 페이지에서 계정 생성
- /login 페이지에서 로그인

# 2. 게시글 기능
- /posts 에서 게시글 목록 확인
- 게시글 작성, 수정, 삭제
- 댓글 작성, 답글 기능

# 3. 실시간 알림
- 다른 브라우저/시크릿모드에서 다른 계정으로 로그인
- 댓글, 좋아요 등의 활동으로 실시간 알림 테스트
```

### 2. UI/UX 테스트
```bash
# 1. 반응형 테스트
- F12 개발자 도구 → 모바일 뷰 확인
- 태블릿, 데스크톱 레이아웃 확인

# 2. 다크모드 테스트
- 우상단 다크모드 토글 버튼 클릭
- 전체 테마 변경 확인

# 3. 알림 시스템 테스트
- 우상단 알림 아이콘 클릭
- 실시간 알림 수신 확인
- 읽음/읽지않음 상태 변경
```

### 3. 성능 테스트
```bash
# 1. 네트워크 상태 확인
curl http://localhost:5000/api/health

# 2. 소켓 연결 상태 확인
curl http://localhost:5000/api/admin/socket-stats

# 3. 브라우저 콘솔에서 WebSocket 로그 확인
```

## 🐛 알려진 이슈 및 해결방법

### 1. WebSocket 연결 실패
**증상**: 알림 아이콘에 빨간 점 표시
**해결**: 
- 서버가 실행 중인지 확인
- 브라우저 새로고침
- 개발자 도구 콘솔에서 에러 메시지 확인

### 2. API 호출 실패
**증상**: 게시글이 로드되지 않음
**해결**:
- 서버 포트 5000 확인
- 환경변수 파일(.env) 확인
- 네트워크 탭에서 API 응답 확인

### 3. 스타일 깨짐
**증상**: CSS가 제대로 적용되지 않음
**해결**:
- Vite 개발 서버 재시작
- 브라우저 캐시 클리어
- SCSS 컴파일 오류 확인

## 📊 모니터링 및 디버깅

### 서버 로그 확인
```bash
# 서버 콘솔에서 실시간 로그 확인
🔌 클라이언트 연결: socket-id
👤 사용자 인증 완료: 닉네임 (user-id)
🔔 알림 전송 완료: 알림제목 -> 사용자 ID
```

### 클라이언트 디버깅
```javascript
// 브라우저 콘솔에서 실행
// 1. 로컬스토리지 확인
console.log('Token:', localStorage.getItem('token'));
console.log('User Info:', localStorage.getItem('userInfo'));

// 2. WebSocket 상태 확인
// 개발자 도구 → Network → WS 탭에서 WebSocket 연결 확인
```

### 데이터베이스 확인
```sql
-- 알림 테이블 확인
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- 사용자 테이블 확인  
SELECT id, username, nickname, created_at FROM users;

-- 게시글 테이블 확인
SELECT id, title, author, created_at FROM posts ORDER BY created_at DESC LIMIT 5;
```

## 🔄 개발 워크플로우

### 1. 새로운 기능 개발시
1. 기능 브랜치 생성
2. 컴포넌트 개발 (Material-UI 사용)
3. API 연동 (apiClient 사용)
4. 스타일링 (테마 시스템 활용)
5. 테스트 및 디버깅

### 2. 스타일 수정시
1. `src/theme/customTheme.js`에서 전역 테마 수정
2. 컴포넌트별 스타일은 Material-UI sx prop 사용
3. 복잡한 스타일은 SCSS 모듈 사용

### 3. API 수정시
1. `src/api/` 폴더의 해당 API 파일 수정
2. 서버 라우트와 동기화 확인
3. 에러 핸들링 추가

## 📝 코딩 컨벤션

### React 컴포넌트
```jsx
// 함수형 컴포넌트 사용
function ComponentName() {
  // hooks 사용
  const [state, setState] = useState();
  
  // Material-UI sx prop으로 스타일링
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6">제목</Typography>
    </Box>
  );
}

export default ComponentName;
```

### API 호출
```javascript
// api 폴더의 함수 사용
import { getPost } from '../api/postApi';

// async/await 사용
const fetchData = async () => {
  try {
    const data = await getPost(id);
    setData(data);
  } catch (error) {
    notifyError('데이터 로드 실패');
  }
};
```

### 알림 사용
```javascript
import { notifySuccess, notifyError } from '../utils/notify';

// 성공 알림
notifySuccess('저장되었습니다!');

// 에러 알림  
notifyError('오류가 발생했습니다.');
```

---

**개발팀**: Pattaku Development Team  
**최종 업데이트**: 2025년 7월 30일  
**버전**: 2.0
