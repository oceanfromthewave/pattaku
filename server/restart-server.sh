#!/bin/bash
# 서버 재시작 스크립트

echo "🔄 서버 재시작 중..."

# 기존 프로세스 종료 (있다면)
pkill -f "node.*app.js" 2>/dev/null || true

echo "📊 users 테이블 구조 확인..."
cd /opt/render/project/src/server
node debug/check-users-table.js

echo "🚀 서버 시작..."
npm run start:production