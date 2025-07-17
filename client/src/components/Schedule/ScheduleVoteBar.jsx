import { useEffect, useState } from "react";
import { notifySuccess, notifyError } from "../../utils/notify";
import styles from "../../styles/ScheduleVoteBar.module.scss";

const STATUS_LABELS = {
  attend: "참여",
  absent: "불참",
  pending: "보류",
};

export default function ScheduleVoteBar({ scheduleId, isLogin }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState([
    { status: "attend", count: 0, nicknames: [] },
    { status: "absent", count: 0, nicknames: [] },
    { status: "pending", count: 0, nicknames: [] }
  ]);
  const [myStatus, setMyStatus] = useState(null);

  // 투표 현황 불러오기
  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/schedules/${scheduleId}/votes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("투표 현황 조회 실패");
      const data = await res.json();
      // [{ status: 'attend', count: 2, nicknames: ['닉1','닉2'] }, ...]
      // 혹시라도 빠진 status 보완
      const safeStats = ["attend", "absent", "pending"].map(status => {
        const found = data.stats.find(s => s.status === status);
        return {
          status,
          count: found ? found.count : 0,
          nicknames: Array.isArray(found?.nicknames) ? found.nicknames : []
        };
      });
      setStats(safeStats);
      setMyStatus(data.myStatus);
    } catch (err) {
      notifyError("투표 현황을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLogin) fetchStats();
  }, [scheduleId, isLogin]);

  // 투표 버튼
  const handleVote = async (status) => {
    if (!isLogin) {
      notifyError("로그인 후 투표할 수 있습니다.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/schedules/${scheduleId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("투표 실패");
      notifySuccess("투표가 반영되었습니다.");
      setMyStatus(status);
      fetchStats();
    } catch {
      notifyError("투표에 실패했습니다.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.voteBar}>
      {stats.map(({ status, count, nicknames }) => (
        <div key={status} style={{ display: "inline-block", textAlign: "center" }}>
          <button
            className={`${styles.voteBtn} ${myStatus === status ? styles.selected : ""}`}
            onClick={() => handleVote(status)}
            disabled={loading || myStatus === status}
            type="button"
          >
            {STATUS_LABELS[status]} ({count})
          </button>
          {/* 닉네임 리스트 안전 처리 */}
          {count > 0 && (
            <div className={styles.nicknameList}>
              <span style={{ fontSize: "0.93em", color: "#b0beff", marginLeft: 3 }}>
                {(nicknames || []).join(", ")}
              </span>
            </div>
          )}
        </div>
      ))}
      {!isLogin && <span className={styles.loginMsg}>로그인 후 투표</span>}
    </div>
  );
}
