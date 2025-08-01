# Pattaku 프로젝트 환경 설정

## 환경별 배포 가이드

### 로컬 개발 환경
```bash
# 클라이언트
cd client
npm run dev

# 서버
cd server
npm start
```

### 프로덕션 배포 (AWS S3)
```bash
cd client
npm run deploy
```

## 환경 변수 설정

### 클라이언트 환경 변수

#### 로컬 개발용 (`.env`)
```
VITE_API_URL=http://localhost:5000
VITE_UPLOADS_URL=http://localhost:5000/uploads
VITE_WS_URL=ws://localhost:5000
```

#### 프로덕션용 (`.env.production`)
```
VITE_API_URL=https://pattaku.onrender.com
VITE_UPLOADS_URL=https://pattaku.onrender.com/uploads
VITE_WS_URL=wss://pattaku.onrender.com
```

## 빌드 스크립트

- `npm run dev`: 로컬 개발 서버 실행
- `npm run build`: 로컬 환경변수로 빌드
- `npm run build:production`: 프로덕션 환경변수로 빌드
- `npm run deploy`: 프로덕션 빌드 후 S3에 배포

## 현재 배포 상태

- **백엔드**: Render (https://pattaku.onrender.com)
- **프론트엔드**: AWS S3 + CloudFront
- **환경 변수**: 자동 환경 감지 설정 완료

## 주요 기능

✅ 환경별 자동 API URL 변경  
✅ WebSocket 연결 URL 자동 설정  
✅ 이미지 업로드 URL 자동 설정  
✅ 로컬/프로덕션 환경 분리  

## 사용법

1. **로컬 개발**: 기본 `.env` 파일이 localhost 설정으로 되어 있음
2. **배포**: `npm run deploy` 명령어가 자동으로 프로덕션 환경변수 사용
3. **환경 확인**: 브라우저 개발자 도구에서 네트워크 탭으로 API 호출 URL 확인 가능
