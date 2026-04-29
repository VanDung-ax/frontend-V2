import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getProgress, getExercises } from "../../services/api";
import {
  MdTrendingUp, MdTrendingDown, MdRemove, MdRefresh, MdWarningAmber
} from "react-icons/md";

const FEATURE_LABELS = {
  thoi_gian_tu_hoc: "STUDY_HOURS",
  chuyen_can: "ATTENDANCE_PCT",
  diem_qua_trinh: "MIDTERM_SCORE",
  hoan_thanh_bai_tap: "TASK_COMPLETION",
  tre_hoc: "LATE_COUNT",
  loai_mon_hoc: "SUBJECT_TYPE",
  tai_lieu_on_tap: "MATERIAL_ACCESS",
  hinh_thuc_thi: "EXAM_FORMAT",
  tre_hoc_phi: "TUITION_DELAY",
  ho_tro: "FINANCIAL_AID",
  hoc_nhom: "GROUP_STUDY",
  lam_them: "PART_TIME_JOB",
  co_kinh_nghiem: "PRIOR_EXPERIENCE"
};

const LOWER_IS_BETTER = ["tre_hoc"];

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
    <div className="cyber-card" style={{ padding: 0 }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--cyber-border)", display: "flex", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-display)', color: "var(--cyber-accent)" }}>METRICS_COMPARISON</h3>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--cyber-text-muted)", letterSpacing: 1 }}>INITIAL_VS_CURRENT</p>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {[{ c: "var(--cyber-success)", l: "IMPROVED" }, { c: "var(--cyber-danger)", l: "DEGRADED" }, { c: "var(--cyber-text-muted)", l: "STABLE" }].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, background: t.c, boxShadow: `0 0 6px ${t.c}` }} />
              <span className="tech-label" style={{ color: t.c }}>{t.l}</span>
            </div>
          ))}
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "rgba(0, 240, 255, 0.05)" }}>
            {["PARAMETER", "T_INITIAL", "T_CURRENT", "DELTA"].map(h => (
              <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontFamily: 'var(--font-display)', color: "var(--cyber-accent)", letterSpacing: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const delta = r.isNumeric && r.v1 !== null && r.v2 !== null ? r.v2 - r.v1 : null;
            const rowBg = r.improved === true ? "rgba(0, 255, 157, 0.05)" : r.improved === false ? "rgba(255, 0, 85, 0.05)" : "transparent";
            return (
              <tr key={r.key} style={{ background: rowBg }}>
                <td style={{ padding: "12px 20px", fontFamily: 'var(--font-mono)', fontSize: 12, color: "var(--cyber-text)", borderTop: "1px solid var(--cyber-border)" }}>{r.label}</td>
                <td style={{ padding: "12px 20px", fontSize: 13, color: "var(--cyber-text-muted)", borderTop: "1px solid var(--cyber-border)" }}>
                  {r.v1 !== null ? (r.isNumeric ? Number(r.v1).toFixed(r.key === "diem_qua_trinh" ? 1 : 0) : r.v1) : "—"}
                </td>
                <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "var(--cyber-text)", borderTop: "1px solid var(--cyber-border)" }}>
                  {r.v2 !== null ? (r.isNumeric ? Number(r.v2).toFixed(r.key === "diem_qua_trinh" ? 1 : 0) : r.v2) : "—"}
                </td>
                <td style={{ padding: "12px 20px", borderTop: "1px solid var(--cyber-border)" }}>
                  {delta !== null && r.changed ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: r.improved ? "var(--cyber-success)" : "var(--cyber-danger)", textShadow: r.improved ? "var(--cyber-success-glow)" : "none" }}>
                      {r.improved ? <MdTrendingUp /> : <MdTrendingDown />}
                      {delta > 0 ? "+" : ""}{delta.toFixed(r.key === "diem_qua_trinh" ? 1 : 0)}
                    </span>
                  ) : (
                    <span style={{ color: "var(--cyber-text-muted)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <MdRemove size={16} /> UNCHANGED
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
      <div className="spinner" style={{ borderColor: 'var(--cyber-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!data || data.history?.length === 0) return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, color: 'var(--cyber-accent)', textShadow: 'var(--cyber-accent-glow)' }}>PROGRESS_TRACKER</h1>
      </div>
      <div className="cyber-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16, color: "var(--cyber-text-muted)" }}>[NO_DATA]</div>
        <h2 style={{ color: "var(--cyber-accent)", fontFamily: 'var(--font-display)' }}>AWAITING_METRICS</h2>
        <p style={{ color: "var(--cyber-text-muted)", fontFamily: 'var(--font-mono)' }}>Complete assignments and run predictions to populate tracking nodes.</p>
      </div>
    </div>
  );

  const { history, improvement, total_sessions } = data;

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, color: 'var(--cyber-accent)', textShadow: 'var(--cyber-accent-glow)', margin: 0 }}>PROGRESS_TRACKER</h1>
          <p style={{ color: "var(--cyber-text-muted)", fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, margin: "4px 0 0" }}>HISTORICAL_RISK_COMPARISON</p>
        </div>
        <button onClick={load} className="cyber-btn" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MdRefresh size={16} /> SYNC_DATA
        </button>
      </div>

      {/* Thống kê bài tập */}
      {exercises && exercises.done_count > 0 && (
        <div className="cyber-card" style={{ padding: "24px", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-display)', color: "var(--cyber-text)" }}>TRAINING_STATISTICS</h3>
            {exercises.done_count >= 3 && exercises.score_percent >= 75 && (
              <span className="cyber-badge cyber-badge-success" style={{ display: "flex", alignItems: "center", gap: 6, boxShadow: "var(--cyber-success-glow)" }}>
                🎉 SIGNIFICANT_IMPROVEMENT_DETECTED
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120, background: "rgba(0, 240, 255, 0.05)", borderRadius: 4, padding: "16px", border: "1px solid var(--cyber-border)", textAlign: "center" }}>
              <div className="tech-label" style={{ marginBottom: 8 }}>TASKS_COMPLETED</div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: "var(--cyber-accent)", textShadow: "var(--cyber-accent-glow)" }}>{exercises.done_count}</div>
            </div>
            <div style={{ flex: 1, minWidth: 120, background: "rgba(0, 255, 157, 0.05)", borderRadius: 4, padding: "16px", border: "1px solid var(--cyber-success)", textAlign: "center" }}>
              <div className="tech-label" style={{ marginBottom: 8, color: "var(--cyber-success)" }}>TASKS_CORRECT</div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: "var(--cyber-success)", textShadow: "var(--cyber-success-glow)" }}>{exercises.correct_count}</div>
            </div>
            <div style={{ flex: 1, minWidth: 120, background: exercises.score_percent >= 75 ? "rgba(0, 255, 157, 0.05)" : "rgba(255, 183, 3, 0.05)", borderRadius: 4, padding: "16px", border: `1px solid ${exercises.score_percent >= 75 ? "var(--cyber-success)" : "var(--cyber-warning)"}`, textAlign: "center" }}>
              <div className="tech-label" style={{ marginBottom: 8, color: exercises.score_percent >= 75 ? "var(--cyber-success)" : "var(--cyber-warning)" }}>ACCURACY_RATE</div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: exercises.score_percent >= 75 ? "var(--cyber-success)" : "var(--cyber-warning)", textShadow: exercises.score_percent >= 75 ? "var(--cyber-success-glow)" : "none" }}>{exercises.score_percent}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Improvement banner */}
      {improvement && (
        <div style={{
          borderRadius: 4, padding: "24px 32px", marginBottom: 28, color: "var(--cyber-text)",
          background: improvement.is_improved
            ? "rgba(0, 255, 157, 0.1)"
            : "rgba(255, 0, 85, 0.1)",
          border: `1px solid ${improvement.is_improved ? "var(--cyber-success)" : "var(--cyber-danger)"}`,
          boxShadow: improvement.is_improved ? "inset 0 0 20px rgba(0, 255, 157, 0.2)" : "inset 0 0 20px rgba(255, 0, 85, 0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 40 }}>{improvement.is_improved ? "🚀" : "⚠️"}</div>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, fontFamily: 'var(--font-display)', color: improvement.is_improved ? "var(--cyber-success)" : "var(--cyber-danger)" }}>
                {improvement.is_improved
                  ? `EXCELLENT // RISK REDUCED BY ${improvement.delta_percent}%`
                  : `WARNING // RISK INCREASED BY ${Math.abs(improvement.delta_percent)}%`}
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 13, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
                FROM <strong>{improvement.first_score}%</strong> (INITIAL) TO <strong>{improvement.last_score}%</strong> (CURRENT)
                — ACROSS <strong>{improvement.sessions_count}</strong> SCANS
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk trend chart - simple visual */}
      <div className="cyber-card" style={{ marginBottom: 28 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontFamily: 'var(--font-display)', color: "var(--cyber-accent)" }}>📈 RISK_TRAJECTORY</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 100 }}>
          {history.map((s, i) => {
            const pct = s.risk_score_percent;
            const color = pct >= 65 ? "var(--cyber-danger)" : pct >= 40 ? "var(--cyber-warning)" : "var(--cyber-success)";
            const barH = Math.max((pct / 100) * 80, 8);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color }}>{pct}%</div>
                <div style={{ width: "100%", height: barH, background: color, borderTop: `2px solid #fff`, transition: "height 1s ease", maxWidth: 48, opacity: 0.8, boxShadow: `0 0 10px ${color}` }} title={`SCAN_${i + 1}: ${pct}%`} />
                <div style={{ fontSize: 9, color: "var(--cyber-text-muted)", textAlign: "center", letterSpacing: 1 }}>
                  {s.is_repredict ? "🔄" : `S${i + 1}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Compare table */}
      {history.length >= 2 && (
        <div>
          <CompareTable history={history} />
        </div>
      )}
    </div>
  );
}
