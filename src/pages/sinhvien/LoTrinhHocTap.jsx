import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getLearningPath, updatePathStatus } from "../../services/api";
import {
  MdCheckCircle, MdRadioButtonUnchecked, MdPlayCircle,
  MdTrendingUp, MdAccessTime, MdEmojiEvents, MdRefresh
} from "react-icons/md";

const STATUS_CONFIG = {
  todo: {
    label: "Chưa bắt đầu",
    icon: <MdRadioButtonUnchecked />,
    color: "#94a3b8",
    bg: "#f8fafc",
    border: "#e2e8f0",
    next: "in_progress"
  },
  in_progress: {
    label: "Đang thực hiện",
    icon: <MdPlayCircle />,
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
    next: "done"
  },
  done: {
    label: "Hoàn thành",
    icon: <MdCheckCircle />,
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#6ee7b7",
    next: "todo"
  }
};

function ProgressRing({ percent, size = 120 }) {
  const r = 44, circ = 2 * Math.PI * r;
  const fill = (circ * Math.min(percent, 100)) / 100;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="url(#pgGrad)" strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`}
        transform="rotate(-90 50 50)" strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s ease" }}
      />
      <defs>
        <linearGradient id="pgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="800" fill="#1e293b">
        {Math.round(percent)}%
      </text>
      <text x="50" y="60" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">
        HOÀN THÀNH
      </text>
    </svg>
  );
}

function PathCard({ path, onStatusChange, index }) {
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[path.status];

  const handleStatus = async () => {
    setUpdating(true);
    try {
      await onStatusChange(path.id, cfg.next);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 16,
        padding: "20px 24px",
        transition: "all 0.3s ease",
        animationDelay: `${index * 0.07}s`,
        opacity: path.status === "done" ? 0.85 : 1
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        {/* Status button */}
        <button
          onClick={handleStatus}
          disabled={updating}
          title={`Nhấn để: ${STATUS_CONFIG[cfg.next]?.label}`}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 28, color: cfg.color, flexShrink: 0,
            padding: 0, lineHeight: 1, marginTop: 2,
            transition: "transform 0.2s ease",
          }}
        >
          {cfg.icon}
        </button>

        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{
              fontWeight: 800, fontSize: 15,
              color: path.status === "done" ? "#64748b" : "#1e293b",
              textDecoration: path.status === "done" ? "line-through" : "none"
            }}>
              {path.risk_reason_label}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px",
              borderRadius: 20, background: cfg.color + "22", color: cfg.color,
              border: `1px solid ${cfg.color}44`
            }}>
              {cfg.label}
            </span>
          </div>

          {/* Mục tiêu */}
          <div style={{
            background: "rgba(99,102,241,0.08)", borderRadius: 10,
            padding: "10px 14px", marginBottom: 14, borderLeft: "3px solid #6366f1"
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#6366f1", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
              🎯 Mục tiêu
            </div>
            <div style={{ fontSize: 13.5, color: "#334155", fontWeight: 500 }}>
              {path.muc_tieu}
            </div>
          </div>

          {/* Hành động */}
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            {(path.hanh_dong || []).map((h, i) => (
              <li key={i} style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function LoTrinhHocTap() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mssv = user?.linked_id;

  const load = async () => {
    if (!mssv) return setLoading(false);
    setLoading(true);
    setError(null);
    try {
      const res = await getLearningPath(mssv);
      setData(res.data);
    } catch (e) {
      setError("Không thể tải lộ trình. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [mssv]);

  const handleStatusChange = async (pathId, newStatus) => {
    try {
      await updatePathStatus(pathId, newStatus);
      setData(prev => ({
        ...prev,
        paths: prev.paths.map(p => p.id === pathId ? { ...p, status: newStatus } : p),
        done_count: prev.paths.filter(p =>
          (p.id === pathId ? newStatus : p.status) === "done"
        ).length
      }));
    } catch (e) {
      alert("Cập nhật thất bại, vui lòng thử lại.");
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p>
        <button className="btn btn-primary" onClick={load} style={{ marginTop: 16 }}>
          <MdRefresh /> Thử lại
        </button>
      </div>
    </div>
  );

  if (!data || data.paths?.length === 0) return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b" }}>Lộ trình học tập</h1>
      </div>
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: "#166534", marginBottom: 8 }}>Xuất sắc!</h2>
        <p style={{ color: "#15803d", fontSize: 15 }}>Bạn không có rủi ro nào cần cải thiện trong đợt dự báo gần nhất.</p>
      </div>
    </div>
  );

  const { paths, total, done_count, risk_score, risk_level } = data;
  const progressPct = total > 0 ? (done_count / total) * 100 : 0;
  const inProgressCount = paths.filter(p => p.status === "in_progress").length;

  return (
    <div style={{ paddingBottom: 48 }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .path-card-anim { animation: fadeUp 0.5s ease both; }
      `}</style>

      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b" }}>Lộ trình học tập</h1>
        <p style={{ color: "#64748b", marginTop: 4 }}>Kế hoạch cải thiện dựa trên phân tích AI của bạn</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: 20, marginBottom: 32, alignItems: "center" }}>
        {/* Progress ring */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
          <ProgressRing percent={progressPct} />
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{done_count}/{total} nhiệm vụ</span>
        </div>

        {/* Stats */}
        {[
          { icon: <MdEmojiEvents size={22} color="#f59e0b" />, label: "Hoàn thành", val: done_count, color: "#f59e0b" },
          { icon: <MdPlayCircle size={22} color="#6366f1" />, label: "Đang làm", val: inProgressCount, color: "#6366f1" },
          { icon: <MdAccessTime size={22} color="#94a3b8" />, label: "Chưa bắt đầu", val: total - done_count - inProgressCount, color: "#94a3b8" }
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {s.icon}
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Path list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", margin: 0 }}>
            📋 {total} nhiệm vụ cần thực hiện
          </h2>
          <button
            onClick={load}
            style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}
          >
            <MdRefresh size={16} /> Làm mới
          </button>
        </div>

        {paths.map((p, i) => (
          <div key={p.id} className="path-card-anim">
            <PathCard path={p} onStatusChange={handleStatusChange} index={i} />
          </div>
        ))}
      </div>

      {progressPct === 100 && (
        <div style={{ marginTop: 32, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 20, padding: "32px 40px", color: "#fff", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 24 }}>Xuất sắc! Bạn đã hoàn thành tất cả nhiệm vụ!</h2>
          <p style={{ opacity: 0.9, marginBottom: 20 }}>Hãy làm bài kiểm tra để xem bạn đã tiến bộ thế nào.</p>
        </div>
      )}
    </div>
  );
}
