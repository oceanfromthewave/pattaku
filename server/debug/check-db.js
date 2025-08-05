// server/debug/check-db.js
// 데이터베이스 연결 및 테이블 확인 스크립트
const db = require('../config/db');

async function checkDatabase() {
  console.log('🔍 데이터베이스 연결 상태 확인...');
  
  try {
    // 1. 기본 연결 테스트
    console.log('\n1. 데이터베이스 연결 테스트...');
    const [rows] = await db.execute('SELECT 1 as test');
    console.log('✅ DB 연결 성공');
    
    // 2. 채팅 관련 테이블 확인
    console.log('\n2. 채팅 테이블 존재 확인...');
    const tables = ['chat_rooms', 'chat_messages', 'chat_participants', 'users'];
    
    for (const table of tables) {
      try {
        const [result] = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${result[0].count}개 레코드`);
      } catch (error) {
        console.error(`❌ ${table}: 테이블 없음 또는 오류`);
      }
    }
    
    // 3. 채팅방 샘플 데이터 확인
    console.log('\n3. 채팅방 샘플 데이터...');
    try {
      const [rooms] = await db.execute('SELECT id, name, type FROM chat_rooms LIMIT 3');
      rooms.forEach(room => {
        console.log(`   방 ${room.id}: ${room.name} (${room.type})`);
      });
    } catch (error) {
      console.error('❌ 채팅방 데이터 조회 실패:', error.message);
    }
    
    // 4. 사용자 샘플 데이터 확인
    console.log('\n4. 사용자 샘플 데이터...');
    try {
      const [users] = await db.execute('SELECT id, nickname FROM users LIMIT 3');
      users.forEach(user => {
        console.log(`   사용자 ${user.id}: ${user.nickname}`);
      });
    } catch (error) {
      console.error('❌ 사용자 데이터 조회 실패:', error.message);
    }
    
    console.log('\n🎉 데이터베이스 체크 완료!');
    
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
  } finally {
    await db.end();
  }
}

// 실행
if (require.main === module) {
  checkDatabase();
}

module.exports = checkDatabase;