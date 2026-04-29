import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getProgress, getExercises } from "../../services/api";
import {
  MdTrendingUp, MdTrendingDown, MdRemove, MdRefresh, MdWarningAmber
} from "react-icons/md";

const FEATURE_LABELS = {
  thoi_gian_tu_hoc: "Giờ tự học/tuần",
  chuyen_can: "Chuyên cần (%)",
  diem_qua_trinh: "Điểm quá trình",
  hoan_thanh_bai_tap: "Hoàn thành BT (%)",
  tre_hoc: "Số lần trễ học",
  loai_mon_hoc: "Loại môn học",
  tai_lieu_on_tap: "Tài liệu ôn tập",
  hinh_thuc_thi: "Hình thức thi",
  tre_hoc_phi: "Trễ học phí",
  ho_tro: "Có hỗ trợ",
  hoc_nhom: "Học nhóm",
  lam_them: "Làm thêm",
  co_kinh_nghiem: "Có kinh nghiệm"
};

// Thuộc tính "tốt hơn = thấp hơn" (rủi ro tỉ lệ thuận)
const LOWER_IS_BETTER = ["tre_hoc"];

function RiskBar({ percent }) {
  const color = percent >= 65 ? "#ef4444" : percent >= 40 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ position: "relative", height: 10, background: "#e2e8f0", borderRadius: 99, overflow: "hidden", minWidth: 120 }}>
      <div style={{
        width: `${Math.min(percent, 100)}%`, height: "100%",
        background: color, borderRadius: 99,
        transition: "width 1.2s cubic-bezier(0.34,1.56,0.64,1)"
      }} />
    </div>
  );
}


function CompareTable({ history }) {
  if (history.length < 2) return null;
  const first = history[0];
  const last = history[history.length - 1];
  if (!first.features || !last.features) return null;

  const rows = Object.keys(FEATURE_LABELS).map(key => {
    const v1 = first.features?.[key];
    const v2 = last.features?.[key];
    const isNumeric = typeof v1 === "number";
    let changed = false, improved = null;
    if (isNumeric && v1 !== null && v2 !== null) {
      changed = v1 !== v2;
      const better = LOWER_IS_BETTER.includes(key) ? v2 < v1 : v2 > v1;
      if (changed) improved = better;
    }
    return { key, label: FEATURE_LABELS[key], v1, v2, isNumeric, changed, improved };
  });

  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e293b" }}>So sánh thông số</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Lần đầu vs Lần mới nhất</p>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {[{ c: "#10b981", l: "Tốt hơn" }, { c: "#ef4444", l: "Xấu hơn" }, { c: "#94a3b8", l: "Không đổi" }].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.c }} />
              <span style={{ fontSize: 11, color: "#64748b" }}>{t.l}</span>
            </div>
          ))}
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Thuộc tính", "Lần đầu", "Mới nhất", "Thay đổi"].map(h => (
              <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const delta = r.isNumeric && r.v1 !== null && r.v2 !== null ? r.v2 - r.v1 : null;
            const rowBg = r.improved === true ? "#f0fdf4" : r.improved === false ? "#fef2f2" : "#fff";
            return (
              <tr key={r.key} style={{ background: i % 2 === 0 ? rowBg : rowBg }}>
                <td style={{ padding: "12px 20px", fontWeight: 600, fontSize: 13, color: "#374151", borderTop: "1px solid #f1f5f9" }}>{r.label}</td>
                <td style={{ padding: "12px 20px", fontSize: 13, color: "#64748b", borderTop: "1px solid #f1f5f9" }}>
                  {r.v1 !== null ? (r.isNumeric ? Number(r.v1).toFixed(r.key === "diem_qua_trinh" ? 1 : 0) : r.v1) : "—"}
                </td>
                <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#1e293b", borderTop: "1px solid #f1f5f9" }}>
                  {r.v2 !== null ? (r.isNumeric ? Number(r.v2).toFixed(r.key === "diem_qua_trinh" ? 1 : 0) : r.v2) : "—"}
                </td>
                <td style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9" }}>
                  {delta !== null && r.changed ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: r.improved ? "#10b981" : "#ef4444" }}>
                      {r.improved ? <MdTrendingUp /> : <MdTrendingDown />}
                      {delta > 0 ? "+" : ""}{delta.toFixed(r.key === "diem_qua_trinh" ? 1 : 0)}
                    </span>
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                      <MdRemove size={16} /> Không đổi
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TienBoSoSanh() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [exercises, setExercises] = useState(null);
  const [loading, setLoading] = useState(true);
  const mssv = user?.linked_id;

  const load = async () => {
    if (!mssv) return setLoading(false);
    setLoading(true);
    try {
      const [resProg, resEx] = await Promise.all([
        getProgress(mssv).catch(() => ({ data: null })),
        getExercises(mssv).catch(() => ({ data: null }))
      ]);
      setData(resProg.data);
      setExercises(resEx.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [mssv]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );

  if (!data || data.history?.length === 0) return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b" }}>Tiến bộ của tôi</h1>
      </div>
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
        <h2 style={{ color: "#475569" }}>Chưa có dữ liệu tiến bộ</h2>
        <p style={{ color: "#64748b" }}>Hãy hoàn thành bài tập và dự báo lại để xem sự tiến bộ của bạn.</p>
      </div>
    </div>
  );

  const { history, improvement, total_sessions } = data;

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0 }}>Tiến bộ của tôi</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0" }}>Lịch sử và so sánh kết quả dự báo</p>
        </div>
        <button onClick={load} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
          <MdRefresh size={16} /> Làm mới
        </button>
      </div>

      {/* Thống kê bài tập */}
      {exercises && exercises.done_count > 0 && (
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: "24px", marginBottom: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e293b" }}>📚 Thống kê Luyện tập</h3>
            {exercises.done_count >= 3 && exercises.score_percent >= 75 && (
              <span style={{ background: "#ecfdf5", color: "#10b981", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, border: "1px solid #6ee7b7", display: "flex", alignItems: "center", gap: 6 }}>
                🎉 Sinh viên có tiến bộ đáng kể
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120, background: "#f8fafc", borderRadius: 12, padding: "16px", border: "1px solid #f1f5f9", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Số câu đã làm</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#3b82f6" }}>{exercises.done_count}</div>
            </div>
            <div style={{ flex: 1, minWidth: 120, background: "#f8fafc", borderRadius: 12, padding: "16px", border: "1px solid #f1f5f9", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Số câu đúng</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>{exercises.correct_count}</div>
            </div>
            <div style={{ flex: 1, minWidth: 120, background: "#f8fafc", borderRadius: 12, padding: "16px", border: "1px solid #f1f5f9", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Tỷ lệ đúng</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: exercises.score_percent >= 75 ? "#10b981" : "#f59e0b" }}>{exercises.score_percent}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Improvement banner */}
      {improvement && (
        <div style={{
          borderRadius: 20, padding: "24px 32px", marginBottom: 28, color: "#fff",
          background: improvement.is_improved
            ? "linear-gradient(135deg, #059669, #10b981)"
            : "linear-gradient(135deg, #dc2626, #ef4444)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 48 }}>{improvement.is_improved ? "🚀" : "💪"}</div>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>
                {improvement.is_improved
                  ? `Xuất sắc! Giảm ${improvement.delta_percent}% rủi ro`
                  : `Cần cố gắng thêm! Rủi ro tăng ${Math.abs(improvement.delta_percent)}%`}
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>
                Từ <strong>{improvement.first_score}%</strong> (lần đầu) → <strong>{improvement.last_score}%</strong> (mới nhất)
                — Qua <strong>{improvement.sessions_count}</strong> lần đánh giá
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk trend chart - simple visual */}
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: "24px", marginBottom: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#1e293b" }}>📈 Xu hướng rủi ro</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 100 }}>
          {history.map((s, i) => {
            const pct = s.risk_score_percent;
            const color = pct >= 65 ? "#ef4444" : pct >= 40 ? "#f59e0b" : "#10b981";
            const barH = Math.max((pct / 100) * 80, 8);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</div>
                <div style={{ width: "100%", height: barH, background: color, borderRadius: "6px 6px 0 0", transition: "height 1s ease", maxWidth: 48 }} title={`Lần ${i + 1}: ${pct}%`} />
                <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>
                  {s.is_repredict ? "↩" : `L${i + 1}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Compare table */}
      {history.length >= 2 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>
            🔍 So sánh chi tiết: Lần đầu vs Lần mới nhất
          </h3>
          <CompareTable history={history} />
        </div>
      )}
    </div>
  );
}
