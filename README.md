# Pattaku - 실시간 커뮤니티 플랫폼 🚀

개선된 UI/UX와 실시간 알림 기능을 갖춘 커뮤니티 플랫폼입니다.

## 🔥 주요 개선사항

### ✨ UI/UX 개선
- **모던한 디자인**: Material-UI 기반 일관된 디자인 시스템
- **반응형 레이아웃**: 모바일, 태블릿, 데스크톱 완벽 지원
- **다크모드**: 완전한 다크/라이트 모드 토글
- **애니메이션**: 부드러운 마이크로 인터랙션
- **그라디언트 배경**: 현대적인 시각적 효과

### 🔔 실시간 알림 시스템
- **WebSocket 연결**: 끊김 없는 실시간 통신
- **자동 재연결**: 네트워크 불안정시 자동 복구
- **브라우저 알림**: 네이티브 푸시 알림 지원
- **읽음 상태 관리**: 실시간 읽음/읽지않음 동기화
- **연결 상태 표시**: 실시간 연결 상태 UI

### 🎨 향상된 헤더
- **모바일 드로어**: 터치 친화적 네비게이션
- **사용자 아바타**: 개인화된 프로필 표시
- **글래스모피즘**: 블러 효과와 투명도
- **그라디언트**: 아름다운 색상 전환

## 🛠️ 기술 스택

### Frontend
- **React 19** - 최신 React 기능 활용
- **Material-UI v6** - 모던 컴포넌트 라이브러리
- **Vite** - 빠른 개발 서버
- **React Router** - 클라이언트사이드 라우팅
- **React Toastify** - 알림 토스트

### Backend
- **Node.js + Express** - 서버 프레임워크
- **Socket.IO** - 실시간 통신
- **JWT** - 인증 시스템
- **MySQL** - 데이터베이스
- **Multer** - 파일 업로드

## 📁 프로젝트 구조

```
pattaku/
├── client/                 # React 클라이언트
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   │   ├── Auth/       # 인증 관련
│   │   │   ├── Posts/      # 게시글 관련
│   │   │   ├── Schedule/   # 스케줄 관련
│   │   │   ├── Notifications/ # 알림 관련
│   │   │   └── MyPage/     # 마이페이지
│   │   ├── api/           # API 클라이언트
│   │   ├── theme/         # 테마 설정
│   │   └── styles/        # SCSS 스타일
│   └── public/            # 정적 파일
├── server/                # Node.js 서버
│   ├── routes/           # API 라우트
│   ├── models/           # 데이터 모델
│   ├── controllers/      # 컨트롤러
│   ├── middleware/       # 미들웨어
│   └── socket/           # 소켓 관련
└── docs/                 # 문서
```

## 🚀 시작하기

### 1. 클론 및 설치
```bash
# 저장소 클론
git clone <repository-url>
cd pattaku

# 서버 의존성 설치
cd server
npm install

# 클라이언트 의존성 설치
cd ../client
npm install
```

### 2. 환경변수 설정

**서버 (.env)**
```env
PORT=5000
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=pattaku
CLIENT_URL=http://localhost:3000
```

**클라이언트 (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
```

### 3. 데이터베이스 설정
```bash
# MySQL 데이터베이스 생성
cd server
node createAllTables.js
```

### 4. 개발 서버 실행
```bash
# 서버 실행 (포트 5000)
cd server
npm run dev

# 클라이언트 실행 (포트 3000)
cd client
npm run dev
```

## 🔧 주요 기능

### 실시간 알림
- 댓글, 답글, 좋아요 실시간 알림
- 브라우저 푸시 알림 지원
- 읽음/읽지않음 상태 관리
- 자동 재연결 및 오프라인 감지

### 사용자 인증
- JWT 기반 로그인/회원가입
- 보안 토큰 관리
- 자동 로그인 상태 유지

### 게시글 시스템
- CRUD 기능 완비
- 이미지 업로드 지원
- 댓글 및 답글 시스템
- 좋아요 기능

### 스케줄 관리
- 스케줄 생성 및 관리
- 투표 시스템
- 댓글 기능

## 🎯 최적화 사항

### 성능 최적화
- **컴포넌트 메모이제이션**: React.memo, useMemo 활용
- **이미지 최적화**: WebP 지원, 압축
- **번들 최적화**: 코드 스플리팅
- **캐싱**: API 응답 캐싱

### 사용자 경험
- **로딩 상태**: 스켈레톤 UI, 스피너
- **에러 처리**: 사용자 친화적 에러 메시지
- **오프라인 지원**: 네트워크 상태 감지
- **접근성**: ARIA 라벨, 키보드 네비게이션

## 🐛 알려진 이슈 및 개선 계획

### 현재 이슈
1. **웹소켓 중복**: Socket.IO와 WebSocket 동시 사용 (정리 예정)
2. **스타일 혼재**: SCSS와 Material-UI 스타일 정리 필요

### 개선 계획
1. **PWA 지원**: 오프라인 기능, 앱 설치
2. **무한 스크롤**: 게시글 목록 최적화
3. **검색 기능**: 전체 텍스트 검색
4. **태그 시스템**: 게시글 분류 기능

## 📊 모니터링

### 서버 상태 확인
```bash
# 헬스체크
curl http://localhost:5000/api/health

# 소켓 통계 (관리자용)
curl http://localhost:5000/api/admin/socket-stats
```

### 로그 확인
- 서버 콘솔에서 실시간 로그 확인
- WebSocket 연결/해제 상태
- 알림 전송 내역

## 🤝 기여하기

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다.

## 🙏 감사인사

- Material-UI 팀
- React 커뮤니티
- Socket.IO 개발팀

---

**개발자**: [Your Name]  
**이메일**: [your.email@example.com]  
**최종 업데이트**: 2025년 7월 30일
