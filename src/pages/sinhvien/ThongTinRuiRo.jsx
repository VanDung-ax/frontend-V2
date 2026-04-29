import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getAllResults } from "../../services/api";
import {
  MdAccessTime, MdCalendarToday, MdStar, MdMenuBook,
  MdCategory, MdBook, MdOutlineQuiz, MdPayments,
  MdSupportAgent, MdAlarm, MdGroups, MdWork, MdTrendingUp,
  MdWarningAmber
} from "react-icons/md";

function RiskDonut({ percent }) {
  const r = 50, size = 140;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const fill = (arc * Math.min(percent, 100)) / 100;
  const color = percent >= 65 ? "var(--cyber-danger)" : percent >= 40 ? "var(--cyber-warning)" : "var(--cyber-success)";

  return (
    <div style={{ filter: `drop-shadow(0 0 10px ${color})` }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10}
          strokeDasharray={`${arc} ${circ}`} transform={`rotate(112.5 ${cx} ${cy})`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${fill} ${circ}`} transform={`rotate(112.5 ${cx} ${cy})`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.34,1.56,0.64,1)" }} />
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="22" fontWeight="900" fill={color} style={{ fontFamily: 'var(--font-display)' }}>
          {percent.toFixed(2)}%
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--cyber-text-muted)" letterSpacing="2">
          RISK
        </text>
      </svg>
    </div>
  );
}

function Tile({ icon, label, value, highlight, index }) {
  return (
    <div style={{
      background: highlight ? "rgba(255, 0, 85, 0.05)" : "var(--cyber-card)",
      border: `1px solid ${highlight ? "var(--cyber-danger)" : "var(--cyber-border)"}`,
      borderRadius: 4, padding: "14px",
      transition: "all 0.3s ease", cursor: "default",
      animationDelay: `${index * 0.04}s`,
      boxShadow: highlight ? "inset 0 0 15px rgba(255, 0, 85, 0.1)" : "none",
      position: "relative",
      overflow: "hidden"
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = highlight ? "var(--cyber-accent-glow)" : "inset 0 0 20px rgba(0, 240, 255, 0.05)"; e.currentTarget.style.borderColor = highlight ? "var(--cyber-danger)" : "var(--cyber-accent)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = highlight ? "inset 0 0 15px rgba(255, 0, 85, 0.1)" : "none"; e.currentTarget.style.borderColor = highlight ? "var(--cyber-danger)" : "var(--cyber-border)"; }}
    >
      <div style={{ fontSize: 20, color: highlight ? "var(--cyber-danger)" : "var(--cyber-accent)", marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', color: highlight ? "var(--cyber-danger)" : "var(--cyber-text)", marginBottom: 4 }}>
        {value ?? "—"}
      </div>
      <div className="tech-label" style={{ fontSize: 10, color: highlight ? "var(--cyber-danger)" : "var(--cyber-text-muted)" }}>
        {label}
      </div>
      {highlight && (
        <div className="cyber-badge cyber-badge-danger" style={{ marginTop: 8, fontSize: 9 }}>
          ⚠ WARNING
        </div>
      )}
    </div>
  );
}

export default function ThongTinRuiRo() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const mssv = user?.linked_id;

  useEffect(() => {
    async function load() {
      if (!mssv) return setLoading(false);
      try {
        const res = await getAllResults();
        const list = res.data || [];
        const mine = list.filter(r => String(r.MSSV) === String(mssv));
        if (mine.length > 0) {
          setData(mine.reduce((a, b) =>
            new Date(a.created_at) > new Date(b.created_at) ? a : b
          ));
        }
      } catch { }
      setLoading(false);
    }
    load();
  }, [mssv]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <div className="spinner" style={{ borderColor: 'var(--cyber-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!data || !data.risk_score) return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, color: 'var(--cyber-accent)', textShadow: 'var(--cyber-accent-glow)' }}>RISK_ANALYSIS</h1>
      </div>
      <div className="cyber-card" style={{ textAlign: "center", border: "1px solid var(--cyber-success)", background: "rgba(0, 255, 157, 0.05)" }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <h2 style={{ color: "var(--cyber-success)", fontFamily: 'var(--font-display)' }}>STATUS: SAFE</h2>
        <p style={{ color: "var(--cyber-text)", fontFamily: 'var(--font-mono)' }}>No anomalous risk patterns detected in recent scans.</p>
      </div>
    </div>
  );

  const pct = (data.risk_score || 0) * 100;
  const isHigh = pct >= 65, isMed = pct >= 40;
  const riskBg = isHigh
    ? "rgba(255, 0, 85, 0.1)"
    : isMed
    ? "rgba(255, 183, 3, 0.1)"
    : "rgba(0, 255, 157, 0.1)";
  const riskBorder = isHigh ? "var(--cyber-danger)" : isMed ? "var(--cyber-warning)" : "var(--cyber-success)";
  const riskLabel = isHigh ? "CRITICAL RISK — ACTION REQUIRED" : isMed ? "ELEVATED RISK" : "SYSTEM SAFE";

  const reasons = Array.isArray(data.warning_reasons) ? data.warning_reasons : [];
  const reasonText = reasons.join(" ").toLowerCase();

  const isHL = (...kws) => kws.some(k => reasonText.includes(k));

  const tiles = [
    { icon: <MdAccessTime />, label: "Giờ tự học/tuần", value: `${data.thoi_gian_tu_hoc ?? 0}h`, highlight: isHL("thoi_gian_tu_hoc", "tự học") },
    { icon: <MdCalendarToday />, label: "Chuyên cần", value: `${data.chuyen_can ?? 0}%`, highlight: isHL("chuyen_can", "chuyên cần", "đi học") },
    { icon: <MdStar />, label: "Điểm quá trình", value: data.diem_qua_trinh ?? 0, highlight: isHL("diem_qua_trinh", "điểm quá trình") },
    { icon: <MdMenuBook />, label: "Hoàn thành BT", value: `${data.hoan_thanh_bai_tap ?? 0}%`, highlight: isHL("hoan_thanh_bai_tap", "bài tập") },
    { icon: <MdCategory />, label: "Loại môn học", value: data.loai_mon_hoc || "—", highlight: isHL("loai_mon_hoc", "môn học") },
    { icon: <MdBook />, label: "Tài liệu ôn tập", value: data.tai_lieu_on_tap || "—", highlight: isHL("tai_lieu_on_tap", "tài liệu") },
    { icon: <MdOutlineQuiz />, label: "Hình thức thi", value: data.hinh_thuc_thi || "—", highlight: isHL("hinh_thuc_thi", "hình thức thi") },
    { icon: <MdPayments />, label: "Trễ học phí", value: data.tre_hoc_phi || "—", highlight: isHL("tre_hoc_phi", "học phí") },
    { icon: <MdSupportAgent />, label: "Có hỗ trợ", value: data.ho_tro || "—", highlight: isHL("ho_tro", "hỗ trợ") },
    { icon: <MdAlarm />, label: "Số lần trễ học", value: data.tre_hoc ?? 0, highlight: isHL("tre_hoc", "trễ học", "đi trễ") },
    { icon: <MdGroups />, label: "Học nhóm", value: data.hoc_nhom || "—", highlight: isHL("hoc_nhom", "học nhóm", "học tập nhóm") },
    { icon: <MdWork />, label: "Làm thêm", value: data.lam_them || "—", highlight: isHL("lam_them", "làm thêm") },
    { icon: <MdTrendingUp />, label: "Có kinh nghiệm", value: data.co_kinh_nghiem || "—", highlight: isHL("co_kinh_nghiem", "kinh nghiệm") },
  ];

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, color: 'var(--cyber-accent)', textShadow: 'var(--cyber-accent-glow)', margin: 0 }}>RISK_ANALYSIS</h1>
        <p style={{ color: "var(--cyber-text-muted)", fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, margin: "4px 0 0" }}>NEURAL_NETWORK_WARNING_SYSTEM</p>
      </div>

      {/* Main risk card + reasons */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 28 }}>
        {/* Risk card */}
        <div className="cyber-card" style={{
          background: riskBg, border: `1px solid ${riskBorder}`,
          display: "flex", gap: 28, alignItems: "center",
          boxShadow: `inset 0 0 30px ${riskBg}`,
        }}>
          <div style={{ flexShrink: 0, zIndex: 1 }}>
            <RiskDonut percent={pct} />
          </div>
          <div style={{ zIndex: 1 }}>
            <div className="cyber-badge" style={{ borderColor: riskBorder, color: riskBorder, marginBottom: 14 }}>
              ⚡ AI_MONITORED
            </div>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: riskBorder, marginBottom: 10, lineHeight: 1.2 }}>{riskLabel}</div>
            <p style={{ fontSize: 13, color: "var(--cyber-text)", opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
              The system has analyzed 13 performance metrics to determine current risk vector.
              {reasons.length > 0 && " Follow the recommended learning path to stabilize."}
            </p>
          </div>
        </div>

        {/* Warning reasons */}
        <div className="cyber-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <MdWarningAmber size={20} color="var(--cyber-danger)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: "var(--cyber-text)" }}>WARNING_VECTORS</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reasons.length > 0 ? reasons.map((r, i) => (
              <div key={i} style={{ background: "rgba(255, 0, 85, 0.05)", borderRadius: 4, padding: "10px", borderLeft: "3px solid var(--cyber-danger)" }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: "var(--cyber-text)", lineHeight: 1.4, fontFamily: 'var(--font-mono)' }}>ERR: {r}</div>
              </div>
            )) : (
              <div style={{ color: "var(--cyber-success)", fontSize: 12, textAlign: "center", padding: 20, background: "rgba(0, 255, 157, 0.05)", border: "1px solid var(--cyber-success)", borderRadius: 4 }}>
                NO_ANOMALIES_FOUND
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 13 Feature tiles */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 4, height: 16, background: 'var(--cyber-accent)', boxShadow: 'var(--cyber-accent-glow)' }}></div>
        <h3 style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: "var(--cyber-text)", letterSpacing: 1, margin: 0 }}>
          13_EVALUATION_METRICS
        </h3>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
        {tiles.map((t, i) => (
          <Tile key={i} index={i} {...t} />
        ))}
      </div>
    </div>
  );
}
