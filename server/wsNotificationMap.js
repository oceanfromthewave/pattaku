// wsNotificationMap.js - Socket.io 기반 알림 시스템으로 업데이트
// 기존 코드와의 호환성을 위해 Map 인터페이스 유지

class NotificationSocketMap {
  constructor() {
    this.wsMap = new Map(); // userId -> socket mapping
  }

  set(userId, socket) {
    this.wsMap.set(userId.toString(), socket);
    console.log("📢 알림 소켓 등록:", userId);
  }

  get(userId) {
    return this.wsMap.get(userId.toString());
  }

  delete(userId) {
    const deleted = this.wsMap.delete(userId.toString());
    if (deleted) {
      console.log("📢 알림 소켓 제거:", userId);
    }
    return deleted;
  }

  has(userId) {
    return this.wsMap.has(userId.toString());
  }

  // 알림 전송 메서드
  sendNotification(userId, notification) {
    const socket = this.get(userId);
    if (socket && socket.connected) {
      socket.emit("notification", notification);
      console.log("📢 알림 전송 성공:", userId, notification.title);
      return true;
    }
    console.log("📢 알림 전송 실패 (사용자 오프라인):", userId);
    return false;
  }

  // 온라인 사용자 수
  getOnlineCount() {
    return this.wsMap.size;
  }

  // 모든 온라인 사용자에게 브로드캐스트
  broadcast(notification) {
    let sentCount = 0;
    for (const [userId, socket] of this.wsMap.entries()) {
      if (socket && socket.connected) {
        socket.emit("notification", notification);
        sentCount++;
      }
    }
    console.log(`📢 브로드캐스트 완료: ${sentCount}명에게 전송`);
    return sentCount;
  }
}

// 싱글톤 인스턴스 생성
const wsNotificationMap = new NotificationSocketMap();

module.exports = wsNotificationMap;
