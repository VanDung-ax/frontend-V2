import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getAllResults } from "../../services/api";
import {
  MdAccessTime, MdCalendarToday, MdStar, MdMenuBook,
  MdCategory, MdBook, MdOutlineQuiz, MdPayments,
  MdSupportAgent, MdAlarm, MdGroups, MdWork, MdTrendingUp,
  MdWarningAmber, MdCheckCircle
} from "react-icons/md";

function CleanDonut({ percent, size = 160 }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  
  let color = '#dc2626';
  let label = 'Rủi ro cực cao';
  if (percent < 40) { color = '#16a34a'; label = 'An toàn'; }
  else if (percent < 65) { color = '#f59e0b'; label = 'Cảnh báo'; }
  else if (percent < 80) { color = '#ea580c'; label = 'Rủi ro cao'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="32" fontWeight="800" fill={color}>
          {percent.toFixed(2)}%
        </text>
      </svg>
      <div style={{ marginTop: 16, fontWeight: 700, color: color, fontSize: 16 }}>{label}</div>
    </div>
  );
}

function Tile({ icon, label, value, highlight }) {
  return (
    <div className="uni-card" style={{
      padding: "16px",
      display: "flex", flexDirection: "column",
      border: highlight ? "1px solid #fca5a5" : "1px solid #e2e8f0",
      background: highlight ? "#fef2f2" : "#fff",
      position: "relative"
    }}>
      <div style={{ color: highlight ? "#dc2626" : "#2563eb", marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: highlight ? "#991b1b" : "#1e293b", marginBottom: 4 }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 13, color: highlight ? "#dc2626" : "#64748b", fontWeight: 500 }}>
        {label}
      </div>
      {highlight && (
        <div style={{ position: "absolute", top: 12, right: 12, color: "#dc2626" }}>
          <MdWarningAmber size={16} />
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

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  if (!data || !data.risk_score) return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>Rủi ro học tập</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Hệ thống phân tích và cảnh báo rủi ro học tập dựa trên AI.</p>
      </div>
      <div className="uni-card" style={{ textAlign: "center", padding: 48 }}>
        <MdCheckCircle size={64} color="#16a34a" style={{ marginBottom: 16 }} />
        <h2 style={{ color: "#16a34a", margin: "0 0 8px 0" }}>Trạng thái: An toàn</h2>
        <p style={{ color: "#475569", margin: 0 }}>Chưa có dữ liệu cảnh báo rủi ro nào cho tài khoản của bạn.</p>
      </div>
    </div>
  );

  const pct = (data.risk_score || 0) * 100;
  const isHigh = pct >= 65, isMed = pct >= 40;
  
  const riskBg = isHigh ? "#fef2f2" : isMed ? "#fffbeb" : "#f0fdf4";
  const riskBorder = isHigh ? "#fca5a5" : isMed ? "#fde68a" : "#bbf7d0";
  const riskColor = isHigh ? "#dc2626" : isMed ? "#d97706" : "#16a34a";
  const riskLabel = isHigh ? "CẢNH BÁO RỦI RO CỰC CAO" : isMed ? "CẢNH BÁO RỦI RO TRUNG BÌNH" : "TRẠNG THÁI AN TOÀN";

  const reasons = Array.isArray(data.warning_reasons) ? data.warning_reasons : [];
  const reasonText = reasons.join(" ").toLowerCase();
  const isHL = (...kws) => kws.some(k => reasonText.includes(k));

  const tiles = [
    { icon: <MdAccessTime size={24} />, label: "Giờ tự học/tuần", value: `${data.thoi_gian_tu_hoc ?? 0}h`, highlight: isHL("thoi_gian_tu_hoc", "tự học") },
    { icon: <MdCalendarToday size={24} />, label: "Chuyên cần", value: `${data.chuyen_can ?? 0}%`, highlight: isHL("chuyen_can", "chuyên cần", "đi học") },
    { icon: <MdStar size={24} />, label: "Điểm quá trình", value: data.diem_qua_trinh ?? 0, highlight: isHL("diem_qua_trinh", "điểm quá trình") },
    { icon: <MdMenuBook size={24} />, label: "Hoàn thành bài tập", value: `${data.hoan_thanh_bai_tap ?? 0}%`, highlight: isHL("hoan_thanh_bai_tap", "bài tập") },
    { icon: <MdCategory size={24} />, label: "Loại môn học", value: data.loai_mon_hoc || "—", highlight: isHL("loai_mon_hoc", "môn học") },
    { icon: <MdBook size={24} />, label: "Tài liệu ôn tập", value: data.tai_lieu_on_tap || "—", highlight: isHL("tai_lieu_on_tap", "tài liệu") },
    { icon: <MdOutlineQuiz size={24} />, label: "Hình thức thi", value: data.hinh_thuc_thi || "—", highlight: isHL("hinh_thuc_thi", "hình thức thi") },
    { icon: <MdPayments size={24} />, label: "Trễ học phí", value: data.tre_hoc_phi || "—", highlight: isHL("tre_hoc_phi", "học phí") },
    { icon: <MdSupportAgent size={24} />, label: "Có hỗ trợ", value: data.ho_tro || "—", highlight: isHL("ho_tro", "hỗ trợ") },
    { icon: <MdAlarm size={24} />, label: "Số lần trễ học", value: data.tre_hoc ?? 0, highlight: isHL("tre_hoc", "trễ học", "đi trễ") },
    { icon: <MdGroups size={24} />, label: "Học nhóm", value: data.hoc_nhom || "—", highlight: isHL("hoc_nhom", "học nhóm", "học tập nhóm") },
    { icon: <MdWork size={24} />, label: "Làm thêm", value: data.lam_them || "—", highlight: isHL("lam_them", "làm thêm") },
    { icon: <MdTrendingUp size={24} />, label: "Có kinh nghiệm", value: data.co_kinh_nghiem || "—", highlight: isHL("co_kinh_nghiem", "kinh nghiệm") },
  ];

  return (
    <div style={{ paddingBottom: 40, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>Phân tích rủi ro học tập</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Hệ thống cảnh báo và phân tích 13 chỉ số học tập dựa trên Trí tuệ nhân tạo.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24, marginBottom: 32 }}>
        {/* Risk card */}
        <div className="uni-card" style={{
          background: riskBg, border: `1px solid ${riskBorder}`,
          display: "flex", gap: 32, alignItems: "center", padding: 32
        }}>
          <div style={{ flexShrink: 0 }}>
            <CleanDonut percent={pct} size={180} />
          </div>
          <div>
            <div className={`uni-badge ${isHigh ? 'uni-badge-danger' : isMed ? 'uni-badge-warning' : 'uni-badge-primary'}`} style={{ marginBottom: 12 }}>
              Phân tích bằng AI
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: riskColor, margin: '0 0 12px 0' }}>{riskLabel}</h2>
            <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Hệ thống đã phân tích 13 tiêu chí đánh giá để xác định mức độ rủi ro hiện tại của bạn.
              {reasons.length > 0 && " Vui lòng xem các nguyên nhân cảnh báo bên cạnh và thực hiện lộ trình khắc phục."}
            </p>
          </div>
        </div>

        {/* Warning reasons */}
        <div className="uni-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <MdWarningAmber size={24} color="#dc2626" />
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Nguyên nhân cảnh báo</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reasons.length > 0 ? reasons.map((r, i) => (
              <div key={i} style={{ background: "#fef2f2", borderRadius: 8, padding: "12px 16px", borderLeft: "4px solid #dc2626" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#991b1b", lineHeight: 1.5 }}>{r}</div>
              </div>
            )) : (
              <div style={{ color: "#16a34a", fontSize: 14, textAlign: "center", padding: 24, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
                Không phát hiện nguyên nhân rủi ro nào.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 13 Feature tiles */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
          Chi tiết 13 chỉ số đánh giá
        </h3>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {tiles.map((t, i) => (
          <Tile key={i} {...t} />
        ))}
      </div>
    </div>
  );
}
