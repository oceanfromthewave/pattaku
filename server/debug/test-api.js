// server/debug/test-api.js
// API 테스트 스크립트
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'your-jwt-token-here'; // 실제 토큰으로 교체

async function testAPI() {
  console.log('🧪 API 테스트 시작...');
  
  try {
    // 1. 서버 상태 체크
    console.log('\n1. 서버 상태 체크...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 서버 상태:', healthRes.data.status);
    console.log('   메모리 사용량:', healthRes.data.memory.heapUsed);
    
    // 2. 채팅방 목록 조회
    console.log('\n2. 채팅방 목록 조회...');
    const roomsRes = await axios.get(`${BASE_URL}/api/chat/rooms`);
    console.log('✅ 채팅방 목록:', roomsRes.data.length, '개');
    
    if (roomsRes.data.length > 0) {
      const roomId = roomsRes.data[0].id;
      
      // 3. 채팅방 상세 조회 (인증 필요)
      console.log(`\n3. 채팅방 상세 조회 (ID: ${roomId})...`);
      const roomRes = await axios.get(`${BASE_URL}/api/chat/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ 채팅방 상세:', roomRes.data.name);
      
      // 4. 메시지 조회 (인증 필요)
      console.log(`\n4. 메시지 조회 (방 ID: ${roomId})...`);
      const messagesRes = await axios.get(`${BASE_URL}/api/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ 메시지 조회:', messagesRes.data.length, '개');
    }
    
    console.log('\n🎉 모든 테스트 완료!');
    
  } catch (error) {
    console.error('❌ API 테스트 실패:', error.message);
    if (error.response) {
      console.error('   상태 코드:', error.response.status);
      console.error('   응답 데이터:', error.response.data);
    }
  }
}

// 실행
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;