// server/debug/check-users-table.js
// users 테이블 구조 확인 스크립트
const db = require('../config/db');

async function checkUsersTable() {
  console.log('🔍 users 테이블 구조 확인...');
  
  try {
    // 1. 테이블 구조 확인
    console.log('\n1. users 테이블 구조:');
    const [columns] = await db.execute('DESCRIBE users');
    columns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL 허용)' : '(NOT NULL)'} ${col.Default ? `기본값: ${col.Default}` : ''}`);
    });
    
    // 2. 프로필 이미지 관련 컬럼 확인
    console.log('\n2. 프로필 이미지 관련 컬럼 확인:');
    const profileImageCols = columns.filter(col => 
      col.Field.toLowerCase().includes('profile') || 
      col.Field.toLowerCase().includes('image') ||
      col.Field.toLowerCase().includes('avatar')
    );
    
    if (profileImageCols.length > 0) {
      profileImageCols.forEach(col => {
        console.log(`   ✅ 발견: ${col.Field} (${col.Type})`);
      });
    } else {
      console.log('   ❌ 프로필 이미지 관련 컬럼이 없습니다.');
      console.log('   💡 profile_image 컬럼을 추가해야 합니다.');
    }
    
    // 3. 샘플 사용자 데이터 확인
    console.log('\n3. 샘플 사용자 데이터:');
    const [users] = await db.execute('SELECT * FROM users LIMIT 3');
    users.forEach(user => {
      const userInfo = `사용자 ${user.id}: ${user.nickname || user.username || user.name}`;
      console.log(`   ${userInfo}`);
    });
    
    // 4. 컬럼 추가 SQL 생성
    if (profileImageCols.length === 0) {
      console.log('\n4. 🔧 수정 SQL:');
      console.log('   다음 SQL을 실행하여 컬럼을 추가하세요:');
      console.log('   ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL;');
    }
    
    console.log('\n🎉 users 테이블 체크 완료!');
    
  } catch (error) {
    console.error('❌ users 테이블 체크 실패:', error);
  } finally {
    await db.end();
  }
}

// 실행
if (require.main === module) {
  checkUsersTable();
}

module.exports = checkUsersTable;