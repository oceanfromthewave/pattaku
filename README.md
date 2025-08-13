# Pattaku - 실시간 커뮤니티 플랫폼 🚀

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()

> 🌟 **실시간 소통을 위한 모던 커뮤니티 플랫폼**  
> Material-UI 기반의 세련된 디자인과 WebSocket을 활용한 실시간 알림 기능을 제공하는 커뮤니티 플랫폼입니다.

## 📋 목차

- [주요 특징](#-주요-특징)
- [기술 스택](#️-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [빠른 시작](#-빠른-시작)
- [설치 가이드](#-설치-가이드)
- [주요 기능](#-주요-기능)
- [API 문서](#-api-문서)
- [개발 가이드](#️-개발-가이드)
- [배포 가이드](#-배포-가이드)
- [최근 업데이트](#-최근-업데이트)
- [성능 최적화](#-성능-최적화)
- [문제 해결](#-문제-해결)
- [기여하기](#-기여하기)
- [라이센스](#-라이센스)

## ✨ 주요 특징

### 🎨 모던한 UI/UX
- **Material-UI v6** 기반 일관된 디자인 시스템
- **완전 반응형** 모바일/태블릿/데스크톱 지원
- **다크모드** 완벽 지원 및 자동 시스템 감지
- **부드러운 애니메이션** 및 마이크로 인터랙션
- **글래스모피즘** 및 그라디언트 효과

### 🔔 실시간 알림 시스템
- **WebSocket** 기반 끊김 없는 실시간 통신
- **자동 재연결** 네트워크 불안정 시 복구
- **브라우저 푸시 알림** 네이티브 지원
- **읽음/미읽음** 상태 실시간 동기화
- **연결 상태** 실시간 표시

### 📱 핵심 기능
- **사용자 인증** JWT 기반 보안 시스템
- **게시글 시스템** CRUD + 이미지 업로드
- **실시간 채팅** 개인/그룹 채팅
- **스케줄 관리** 투표 시스템 포함
- **댓글 시스템** 대댓글 및 실시간 알림

## 🛠️ 기술 스택

### 🎨 Frontend
| 기술 | 용도 | 버전 |
|------|------|------|
| **React** | UI 프레임워크 | 19.x |
| **Material-UI** | 컴포넌트 라이브러리 | v6 |
| **Vite** | 개발 서버 & 번들러 | Latest |
| **React Router** | 클라이언트 라우팅 | v6 |
| **SCSS** | 스타일링 | Latest |
| **Socket.IO Client** | 실시간 통신 | Latest |

### ⚙️ Backend
| 기술 | 용도 | 버전 |
|------|------|------|
| **Node.js** | 런타임 환경 | 18+ |
| **Express** | 웹 프레임워크 | Latest |
| **Socket.IO** | 실시간 통신 | Latest |
| **MySQL2** | 데이터베이스 | Latest |
| **JWT** | 인증 시스템 | Latest |
| **Multer** | 파일 업로드 | Latest |

### 🏗️ 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│  Express API    │◄──►│  MySQL Database │
│  (Port 3000)    │    │  (Port 5000)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
           WebSocket Connection
               (Socket.IO)
```

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

## ⚡ 빠른 시작

### 🚀 원클릭 실행 (Windows)
```bash
# 전체 개발 환경 한번에 시작
start-dev.bat
```

### 📖 설치 가이드

#### 1️⃣ 사전 요구사항
- **Node.js** 18.0.0 이상
- **MySQL** 8.0 이상
- **Git**

#### 2️⃣ 프로젝트 클론
```bash
git clone <repository-url>
cd pattaku
```

#### 3️⃣ 의존성 설치
```bash
# 루트에서 모든 의존성 설치
npm install

# 또는 개별 설치
cd server && npm install
cd ../client && npm install
```

#### 4️⃣ 환경변수 설정

**📄 server/.env**
```env
# 서버 설정
PORT=5000
NODE_ENV=development

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=pattaku

# 보안 설정
JWT_SECRET=your-very-secure-secret-key-here
JWT_EXPIRES_IN=7d

# CORS 설정
CLIENT_URL=http://localhost:3000

# 파일 업로드 설정
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

**📄 client/.env**
```env
# API 엔드포인트
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000

# 개발 모드 설정
VITE_DEV_MODE=true
```

#### 5️⃣ 데이터베이스 초기화
```bash
cd server

# MySQL 데이터베이스 생성 (수동)
mysql -u root -p
CREATE DATABASE pattaku CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 테이블 자동 생성
node createAllTables.js
```

#### 6️⃣ 개발 서버 실행
```bash
# 방법 1: 자동 스크립트 (권장)
start-dev.bat

# 방법 2: 수동 실행
# 터미널 1 - 서버
cd server
npm run dev

# 터미널 2 - 클라이언트  
cd client
npm run dev
```

#### 7️⃣ 접속 확인
- **클라이언트**: http://localhost:3000
- **API 서버**: http://localhost:5000
- **API 문서**: http://localhost:5000/api-docs (개발 중)

## 🔧 주요 기능

### 🔐 사용자 시스템
| 기능 | 설명 | 상태 |
|------|------|------|
| **회원가입/로그인** | JWT 기반 보안 인증 | ✅ |
| **프로필 관리** | 이미지 업로드, 정보 수정 | ✅ |
| **자동 로그인** | 토큰 기반 상태 유지 | ✅ |
| **권한 관리** | 역할 기반 접근 제어 | ✅ |

### 📝 게시글 시스템
| 기능 | 설명 | 상태 |
|------|------|------|
| **CRUD 작업** | 생성/조회/수정/삭제 | ✅ |
| **이미지 업로드** | 다중 이미지 지원 | ✅ |
| **댓글 시스템** | 대댓글 무제한 뎁스 | ✅ |
| **좋아요** | 실시간 카운트 | ✅ |
| **검색/필터** | 제목, 내용 검색 | 🚧 |

### 💬 실시간 채팅
| 기능 | 설명 | 상태 |
|------|------|------|
| **개인 채팅** | 1:1 실시간 메시징 | ✅ |
| **그룹 채팅** | 다중 사용자 채팅방 | ✅ |
| **파일 전송** | 이미지, 문서 전송 | ✅ |
| **읽음 표시** | 실시간 읽음 상태 | ✅ |

### 📅 스케줄 관리
| 기능 | 설명 | 상태 |
|------|------|------|
| **일정 생성** | 개인/그룹 일정 관리 | ✅ |
| **투표 시스템** | 날짜/시간 투표 | ✅ |
| **알림** | 일정 리마인더 | ✅ |
| **댓글** | 일정별 토론 | ✅ |

### 🔔 알림 시스템
| 기능 | 설명 | 상태 |
|------|------|------|
| **실시간 알림** | WebSocket 기반 | ✅ |
| **푸시 알림** | 브라우저 네이티브 | ✅ |
| **읽음 관리** | 상태 동기화 | ✅ |
| **알림 설정** | 개인화 옵션 | 🚧 |

## 📊 API 문서

### 🔗 엔드포인트 목록

#### 🔐 인증 API
```http
POST   /api/auth/register    # 회원가입
POST   /api/auth/login       # 로그인
POST   /api/auth/logout      # 로그아웃
GET    /api/auth/me          # 현재 사용자 정보
PUT    /api/auth/profile     # 프로필 업데이트
```

#### 📝 게시글 API
```http
GET    /api/posts            # 게시글 목록 조회
POST   /api/posts            # 게시글 생성
GET    /api/posts/:id        # 게시글 상세 조회
PUT    /api/posts/:id        # 게시글 수정
DELETE /api/posts/:id        # 게시글 삭제
POST   /api/posts/:id/like   # 좋아요 토글
```

#### 💬 댓글 API
```http
GET    /api/comments/:postId       # 댓글 목록
POST   /api/comments/:postId       # 댓글 작성
PUT    /api/comments/:id           # 댓글 수정
DELETE /api/comments/:id           # 댓글 삭제
```

#### 💬 채팅 API
```http
GET    /api/chat/rooms             # 채팅방 목록
POST   /api/chat/rooms             # 채팅방 생성
GET    /api/chat/rooms/:id/messages # 메시지 목록
POST   /api/chat/rooms/:id/messages # 메시지 전송
```

#### 📅 스케줄 API
```http
GET    /api/schedules              # 스케줄 목록
POST   /api/schedules              # 스케줄 생성
PUT    /api/schedules/:id          # 스케줄 수정
DELETE /api/schedules/:id          # 스케줄 삭제
POST   /api/schedules/:id/vote     # 투표
```

#### 🔔 알림 API
```http
GET    /api/notifications          # 알림 목록
PUT    /api/notifications/:id/read # 읽음 처리
DELETE /api/notifications/:id      # 알림 삭제
```

### 📋 응답 형식
```json
{
  "success": true,
  "data": { /* 실제 데이터 */ },
  "message": "Success message",
  "timestamp": "2025-08-13T12:00:00Z"
}
```

## 🛠️ 개발 가이드

### 🔧 개발 도구
```bash
# 빌드 도구
npm run build          # 프로덕션 빌드
npm run build:client   # 클라이언트만 빌드
npm run build:server   # 서버만 빌드

# 테스트 도구
npm test               # 전체 테스트 실행
npm run test:client    # 클라이언트 테스트
npm run test:server    # 서버 테스트

# 코드 품질
npm run lint           # ESLint 검사
npm run format         # Prettier 포맷팅
npm run type-check     # TypeScript 타입 검사
```

### 🎯 성능 최적화
| 영역 | 기법 | 상태 |
|------|------|------|
| **React** | memo, useMemo, useCallback | ✅ |
| **이미지** | WebP, 압축, lazy loading | ✅ |
| **번들** | 코드 스플리팅, tree shaking | 🚧 |
| **API** | 응답 캐싱, 요청 최적화 | ✅ |
| **DB** | 인덱싱, 쿼리 최적화 | ✅ |

### 🎨 UI/UX 최적화
| 영역 | 기법 | 상태 |
|------|------|------|
| **로딩** | 스켈레톤 UI, 프로그레스 바 | ✅ |
| **에러** | 사용자 친화적 메시지 | ✅ |
| **오프라인** | 네트워크 상태 감지 | ✅ |
| **접근성** | ARIA, 키보드 네비게이션 | ✅ |
| **반응형** | 모바일 퍼스트 디자인 | ✅ |

## 🚀 배포 가이드

### 🐳 Docker 배포
```bash
# Docker 이미지 빌드
docker build -t pattaku .

# 컨테이너 실행
docker run -p 3000:3000 -p 5000:5000 pattaku
```

### ☁️ 클라우드 배포
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Heroku, AWS
- **Database**: PlanetScale, Railway MySQL
- **Storage**: AWS S3, Cloudinary

## 🔄 최근 업데이트 (2025년 8월)

### ✅ 해결된 주요 이슈
| 이슈 | 해결 방법 | 영향도 |
|------|-----------|--------|
| **API 임포트 오류** | `chatApi` 임포트 경로 통일 | 🔴 High |
| **중복 파일 정리** | Enhanced/Improved 컴포넌트 제거 | 🟡 Medium |
| **DB 연결 안정화** | MySQL2 호환성 개선 | 🔴 High |
| **Graceful Shutdown** | 서버 종료 프로세스 개선 | 🟡 Medium |

### 🆕 새로운 기능
- ✨ **개발자 대시보드**: 실시간 서버 상태 모니터링
- 🚀 **원클릭 실행**: `start-dev.bat` 스크립트 추가
- 📦 **빌드 최적화**: 프로덕션 빌드 프로세스 개선
- 🔧 **AI 어시스턴트**: GPT 기반 도우미 기능

### 🧹 코드 품질 개선
- 중복 문서 파일 통합 및 정리
- 백업 파일 및 임시 파일 제거
- API 클라이언트 일관성 개선
- TypeScript 타입 안전성 강화

## 🔍 문제 해결

### 🚨 일반적인 문제

#### 📡 서버 연결 실패
```bash
# 1. 포트 확인
netstat -ano | findstr :5000

# 2. 환경변수 확인
echo $VITE_API_URL

# 3. 서버 재시작
cd server && npm run dev
```

#### 🗄️ 데이터베이스 연결 오류
```bash
# 1. MySQL 상태 확인
mysql -u root -p -e "SHOW DATABASES;"

# 2. 연결 테스트
cd server && node debug/check-db.js

# 3. 테이블 재생성
node createAllTables.js
```

#### 📦 의존성 문제
```bash
# 1. 캐시 정리
npm cache clean --force

# 2. node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# 3. 전체 재빌드
npm run clean && npm run build
```

### 📊 모니터링 도구

#### 🩺 헬스체크
```bash
# API 서버 상태
curl http://localhost:5000/api/health

# WebSocket 연결 상태
curl http://localhost:5000/api/socket-stats

# 데이터베이스 상태
curl http://localhost:5000/api/db-status
```

#### 📈 성능 모니터링
- **클라이언트**: React DevTools, Lighthouse
- **서버**: Node.js 내장 프로파일러
- **데이터베이스**: MySQL Performance Schema
- **네트워크**: Browser DevTools Network 탭

## 🗺️ 로드맵

### 🎯 단기 목표 (1-2개월)
- [ ] **PWA 지원**: 서비스 워커, 매니페스트
- [ ] **무한 스크롤**: 게시글/댓글 페이지네이션
- [ ] **검색 기능**: 제목, 내용, 태그 검색
- [ ] **알림 설정**: 개인화 알림 옵션

### 🚀 중기 목표 (3-6개월)
- [ ] **실시간 협업**: 문서 공동 편집
- [ ] **파일 시스템**: 클라우드 스토리지 연동
- [ ] **태그 시스템**: 게시글 분류 및 필터링
- [ ] **모바일 앱**: React Native 포팅

### 🌟 장기 목표 (6개월+)
- [ ] **AI 통합**: 자동 태깅, 요약, 추천
- [ ] **다국어 지원**: i18n 국제화
- [ ] **플러그인 시스템**: 확장 가능한 아키텍처
- [ ] **엔터프라이즈**: SSO, 권한 관리

## 🤝 기여하기

### 🌟 기여 방법

1. **🍴 Fork** 프로젝트를 본인 계정으로 Fork
2. **🌿 브랜치** 새로운 기능 브랜치 생성
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **💾 커밋** 변경사항 커밋
   ```bash
   git commit -m '✨ Add amazing feature'
   ```
4. **📤 푸시** 브랜치에 푸시
   ```bash
   git push origin feature/amazing-feature
   ```
5. **🔄 PR** Pull Request 생성

### 📋 기여 가이드라인

#### 🎨 코드 스타일
- **ESLint**: 코드 품질 준수
- **Prettier**: 일관된 포맷팅
- **컨벤션**: 기존 코드 스타일 따르기

#### 💬 커밋 메시지
```
<type>(<scope>): <description>

✨ feat: 새로운 기능 추가
🐛 fix: 버그 수정
📚 docs: 문서 업데이트
🎨 style: 코드 포맷팅
♻️ refactor: 코드 리팩토링
✅ test: 테스트 추가/수정
🔧 chore: 빌드/설정 변경
```

#### 🧪 테스트
- 새로운 기능에는 테스트 포함
- 기존 테스트 통과 확인
- PR 전 로컬 테스트 실행

### 🐛 버그 리포트
[GitHub Issues](https://github.com/your-repo/pattaku/issues)에서:
- 버그 재현 단계 상세히 기술
- 환경 정보 포함 (OS, 브라우저, Node.js 버전)
- 스크린샷 또는 에러 로그 첨부

### 💡 기능 요청
새로운 기능 제안:
- 명확한 사용 사례 설명
- 기대하는 동작 기술
- 기존 기능과의 호환성 고려

## 📄 라이센스

```
MIT License

Copyright (c) 2025 Pattaku Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND...
```

## 🙏 감사인사

### 🛠️ 핵심 기술
- **React Team** - 혁신적인 UI 라이브러리
- **Material-UI** - 아름다운 컴포넌트 시스템
- **Socket.IO** - 강력한 실시간 통신
- **Express.js** - 신뢰할 수 있는 서버 프레임워크

### 👥 커뮤니티
- **오픈소스 기여자들** - 모든 기여에 감사합니다
- **사용자 피드백** - 소중한 의견과 버그 리포트
- **개발자 커뮤니티** - 지속적인 영감과 동기부여

---

<div align="center">

**🚀 Pattaku - 실시간 커뮤니티 플랫폼**

[![Stars](https://img.shields.io/github/stars/your-repo/pattaku?style=social)](https://github.com/your-repo/pattaku)
[![Forks](https://img.shields.io/github/forks/your-repo/pattaku?style=social)](https://github.com/your-repo/pattaku)
[![Issues](https://img.shields.io/github/issues/your-repo/pattaku)](https://github.com/your-repo/pattaku/issues)

**💫 Made with ❤️ by Pattaku Team**

</div>
