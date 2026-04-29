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
  const color = percent >= 65 ? "#ef4444" : percent >= 40 ? "#f59e0b" : "#10b981";

  return (
    <div style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.2))" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={10}
          strokeDasharray={`${arc} ${circ}`} transform={`rotate(112.5 ${cx} ${cy})`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={10}
          strokeDasharray={`${fill} ${circ}`} transform={`rotate(112.5 ${cx} ${cy})`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.34,1.56,0.64,1)" }} />
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="22" fontWeight="900" fill="#fff">
          {percent.toFixed(2)}%
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(255,255,255,0.8)" letterSpacing="2">
          RỦI RO
        </text>
      </svg>
    </div>
  );
}

function Tile({ icon, label, value, highlight, index }) {
  return (
    <div style={{
      background: highlight ? "#fef2f2" : "#fff",
      border: `1.5px solid ${highlight ? "#fecaca" : "#e2e8f0"}`,
      borderRadius: 14, padding: "14px",
      transition: "all 0.3s ease", cursor: "default",
      animationDelay: `${index * 0.04}s`,
      boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)"; }}
    >
      <div style={{ fontSize: 20, color: highlight ? "#ef4444" : "#6366f1", marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: highlight ? "#991b1b" : "#1e293b", marginBottom: 4 }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 11, color: highlight ? "#dc2626" : "#64748b", fontWeight: highlight ? 700 : 500 }}>
        {label}
      </div>
      {highlight && (
        <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: 20, display: "inline-block" }}>
          ⚠ RỦI RO
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
      <div className="spinner" />
    </div>
  );

  if (!data || !data.risk_score) return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header"><h1>Thông tin rủi ro học tập</h1></div>
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <h2 style={{ color: "#16a34a" }}>Xin chúc mừng!</h2>
        <p style={{ color: "#15803d" }}>Bạn không nằm trong danh sách cảnh báo rủi ro ở đợt dự báo mới nhất.</p>
      </div>
    </div>
  );

  const pct = (data.risk_score || 0) * 100;
  const isHigh = pct >= 65, isMed = pct >= 40;
  const riskBg = isHigh
    ? "linear-gradient(135deg,#b91c1c,#7f1d1d)"
    : isMed
    ? "linear-gradient(135deg,#d97706,#92400e)"
    : "linear-gradient(135deg,#059669,#064e3b)";
  const riskLabel = isHigh ? "Rủi ro cao — Cần hành động ngay" : isMed ? "Rủi ro trung bình" : "An toàn";

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
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0 }}>Thông tin rủi ro học tập</h1>
        <p style={{ color: "#64748b", margin: "4px 0 0" }}>Phân tích cảnh báo bởi hệ thống AI</p>
      </div>

      {/* Main risk card + reasons */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 28 }}>
        {/* Risk card */}
        <div style={{
          background: riskBg, borderRadius: 24, padding: "32px 36px",
          color: "#fff", display: "flex", gap: 28, alignItems: "center",
          boxShadow: "0 20px 40px -12px rgba(0,0,0,0.3)",
          position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", right: -10, top: -20, width: "45%", height: "140%", background: "radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)", transform: "rotate(20deg)" }} />
          <div style={{ flexShrink: 0, zIndex: 1 }}>
            <RiskDonut percent={pct} />
          </div>
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, background: "rgba(255,255,255,0.2)", padding: "5px 12px", borderRadius: 20, display: "inline-flex", gap: 6, marginBottom: 14, backdropFilter: "blur(4px)" }}>
              ⚡ Theo dõi tự động bởi AI
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 10, lineHeight: 1.2 }}>{riskLabel}</div>
            <p style={{ fontSize: 13.5, opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
              Hệ thống AI đã phân tích 13 chỉ số học tập của bạn và xác định mức độ rủi ro hiện tại.
              {reasons.length > 0 && " Xem lộ trình học tập và làm bài tập để cải thiện."}
            </p>
          </div>
        </div>

        {/* Warning reasons */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ background: "#fee2e2", color: "#ef4444", padding: 8, borderRadius: 10 }}>
              <MdWarningAmber size={20} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>Nguyên nhân cảnh báo</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reasons.length > 0 ? reasons.map((r, i) => (
              <div key={i} style={{ background: "#fef2f2", borderRadius: 12, padding: "12px 14px", border: "1px solid #fee2e2" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#991b1b", lineHeight: 1.4 }}>{r}</div>
              </div>
            )) : (
              <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: 20, background: "#f8fafc", borderRadius: 12 }}>
                Không có nguyên nhân cụ thể.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 13 Feature tiles */}
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>
        13 Thuộc tính đánh giá rủi ro
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
        {tiles.map((t, i) => (
          <Tile key={i} index={i} {...t} />
        ))}
      </div>
    </div>
  );
}
