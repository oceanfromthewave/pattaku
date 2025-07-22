import { useEffect, useState } from "react";
import { notifySuccess, notifyError } from "../../utils/notify";
import classNames from "classnames";
import styles from "../../styles/ScheduleVoteBar.module.scss";
import authFetch from "../../utils/authFetch";


// 투표 상태별 라벨
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
      const res = await authFetch(`/api/schedules/${scheduleId}/votes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("투표 현황 조회 실패");
      const data = await res.json();
      // ["attend", "absent", "pending"] 기준으로 안전하게 재정렬
      const safeStats = ["attend", "absent", "pending"].map(status => {
        const found = (data.stats || []).find(s => s.status === status);
        return {
          status,
          count: found?.count || 0,
          nicknames: Array.isArray(found?.nicknames) ? found.nicknames : []
        };
      });
      setStats(safeStats);
      setMyStatus(data.myStatus ?? null);
    } catch (err) {
      notifyError("투표 현황을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLogin) fetchStats();
    // eslint-disable-next-line
  }, [scheduleId, isLogin]);

  // 투표
  const handleVote = async (status) => {
    if (!isLogin) {
      notifyError("로그인 후 투표할 수 있습니다.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch(`/api/schedules/${scheduleId}/vote`, {
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
        <div key={status} className={styles.voteItem}>
          <button
            className={classNames(
              styles.voteBtn,
              { [styles.selected]: myStatus === status }
            )}
            onClick={() => handleVote(status)}
            disabled={loading || myStatus === status}
            type="button"
          >
            {STATUS_LABELS[status]} ({count})
          </button>
          {count > 0 && (
            <div className={styles.nicknameList}>
              {nicknames.join(", ")}
            </div>
          )}
        </div>
      ))}
      {!isLogin && <span className={styles.loginMsg}></span>}
    </div>
  );
}
