import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getProgress, getExercises, getTamLyStats, getExerciseHistory } from "../../services/api";
import {
  MdTrendingUp, MdRefresh, MdWarningAmber, MdCheckCircle
} from "react-icons/md";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const FEATURE_LABELS = {
  thoi_gian_tu_hoc: "Giờ tự học/tuần",
  chuyen_can: "Tỷ lệ chuyên cần",
  diem_qua_trinh: "Điểm quá trình",
  hoan_thanh_bai_tap: "Hoàn thành bài tập",
  tre_hoc: "Số lần trễ học",
  loai_mon_hoc: "Loại môn học",
  tai_lieu_on_tap: "Tài liệu ôn tập",
  hinh_thuc_thi: "Hình thức thi",
  tre_hoc_phi: "Trễ học phí",
  ho_tro: "Hỗ trợ tài chính",
  hoc_nhom: "Học nhóm",
  lam_them: "Làm thêm",
  co_kinh_nghiem: "Kinh nghiệm thực tế"
};

const LOWER_IS_BETTER = ["tre_hoc"];



export default function TienBoSoSanh() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [exercises, setExercises] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tamLyStats, setTamLyStats] = useState(null);
  const [exHistory, setExHistory] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null); // index lần làm được chọn
  const mssv = user?.linked_id;

  const load = async () => {
    if (!mssv) return setLoading(false);
    setLoading(true);
    try {
      const [resProg, resEx, resTamLy, resExHist] = await Promise.all([
        getProgress(mssv).catch(() => ({ data: null })),
        getExercises(mssv).catch(() => ({ data: null })),
        getTamLyStats(mssv).catch(() => ({ data: null })),
        getExerciseHistory(mssv).catch(() => ({ data: { history: [] } }))
      ]);
      setData(resProg.data);
      setExercises(resEx.data);
      setTamLyStats(resTamLy.data);
      setExHistory(resExHist.data?.history || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [mssv]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  if (!data || data.history?.length === 0) return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>Tiến bộ của tôi</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Theo dõi sự thay đổi của các chỉ số học tập qua từng giai đoạn.</p>
      </div>
      <div className="uni-card" style={{ textAlign: "center", padding: 48 }}>
        <MdTrendingUp size={64} color="#cbd5e1" style={{ marginBottom: 16 }} />
        <h2 style={{ color: "#475569", margin: "0 0 8px 0" }}>Chưa có dữ liệu tiến độ</h2>
        <p style={{ color: "#64748b", margin: 0 }}>Hãy hoàn thành các bài tập AI để hệ thống có thể theo dõi và đánh giá sự tiến bộ của bạn.</p>
      </div>
    </div>
  );

  const { history, improvement, total_sessions } = data;

  return (
    <div style={{ paddingBottom: 48, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>Tiến bộ của tôi</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: 15 }}>Theo dõi sự thay đổi của các chỉ số học tập và đánh giá sự cải thiện.</p>
        </div>
        <button onClick={load} className="uni-btn" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MdRefresh size={20} /> Làm mới dữ liệu
        </button>
      </div>

      {/* Thống kê Bài kiểm tra Tâm lý & Thói quen */}
      {tamLyStats && tamLyStats.total_questions > 0 && (
        <div className="uni-card" style={{ padding: 32, marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Khảo sát Tâm lý & Thói quen học tập</h3>
            {tamLyStats.score_percent >= 75 && (
              <span className="uni-badge uni-badge-success" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 12px" }}>
                <MdCheckCircle size={16} /> Đánh giá: Tâm lý ổn định
              </span>
            )}
            {tamLyStats.score_percent < 75 && (
              <span className="uni-badge uni-badge-warning" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 12px" }}>
                <MdWarningAmber size={16} /> Đánh giá: Cần chú ý tâm lý
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 24, border: "1px solid #e2e8f0", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 8 }}>TỔNG SỐ CÂU ĐÃ LÀM</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#334155" }}>{tamLyStats.total_questions}</div>
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 24, border: "1px solid #bbf7d0", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#10b981", marginBottom: 8 }}>TRẢ LỜI TÍCH CỰC</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#047857" }}>{tamLyStats.correct_count}</div>
            </div>
            <div style={{ background: tamLyStats.score_percent >= 75 ? "#f0fdf4" : "#fffbeb", borderRadius: 12, padding: 24, border: `1px solid ${tamLyStats.score_percent >= 75 ? "#bbf7d0" : "#fde68a"}`, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: tamLyStats.score_percent >= 75 ? "#10b981" : "#d97706", marginBottom: 8 }}>MỨC ĐỘ ỔN ĐỊNH</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: tamLyStats.score_percent >= 75 ? "#047857" : "#b45309" }}>{tamLyStats.score_percent}%</div>
            </div>
          </div>
          <p style={{ marginTop: 24, fontSize: 15, color: "#475569", background: "#f8fafc", padding: 16, borderRadius: 8, borderLeft: "4px solid #3b82f6", margin: "24px 0 0 0" }}>
            <strong>Lời khuyên: </strong>
            {tamLyStats.score_percent >= 75 
              ? "Trạng thái tâm lý và phương pháp học tập của bạn hiện đang rất tốt. Rủi ro học tập (nếu có) chủ yếu đến từ việc hổng kiến thức chuyên môn. Hãy tiếp tục duy trì thói quen này và tập trung ôn tập thêm kiến thức bằng Bài tập AI."
              : "Bạn đang gặp một số vấn đề về tâm lý, động lực học tập hoặc phương pháp quản lý thời gian chưa hiệu quả. Bạn nên cân nhắc điều chỉnh lại lịch sinh hoạt, tăng cường học nhóm, và mạnh dạn xin hỗ trợ từ giảng viên/cố vấn học tập."}
          </p>
        </div>
      )}

      {/* Thống kê bài tập */}
      {(exercises && exercises.done_count > 0) || exHistory.length > 0 ? (() => {
        // Tính tổng tất cả các lần làm bài
        const totalDone  = exHistory.length > 0
          ? exHistory.reduce((sum, s) => sum + (s.total || 0), 0)
          : exercises?.done_count || 0;
        const totalRight = exHistory.length > 0
          ? exHistory.reduce((sum, s) => sum + (s.correct || 0), 0)
          : exercises?.correct_count || 0;
        const totalPct   = totalDone > 0
          ? Math.round((totalRight / totalDone) * 1000) / 10
          : 0;

        return (
        <div className="uni-card" style={{ padding: 32, marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Thống kê rèn luyện AI</h3>
            {totalPct >= 80 && totalDone >= 2 && (
              <span className="uni-badge uni-badge-success" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 12px" }}>
                <MdCheckCircle size={16} /> Đánh giá: Tiến bộ tốt
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
            {/* Ô 1: Tổng câu đã làm (tất cả lần) */}
            <div style={{ background: "#eff6ff", borderRadius: 12, padding: 24, border: "1px solid #bfdbfe", textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#3b82f6", marginBottom: 4 }}>BÀI TẬP ĐÃ LÀM</div>
              <div style={{ fontSize: 11, color: "#93c5fd", marginBottom: 8 }}>tất cả các lần</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#1d4ed8" }}>{totalDone}</div>
            </div>
            {/* Ô 2: Tổng câu đúng */}
            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 24, border: "1px solid #bbf7d0", textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#10b981", marginBottom: 4 }}>TRẢ LỜI ĐÚNG</div>
              <div style={{ fontSize: 11, color: "#6ee7b7", marginBottom: 8 }}>tất cả các lần</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#047857" }}>{totalRight}</div>
            </div>
            {/* Ô 3: Tỷ lệ chung */}
            <div style={{ background: totalPct >= 75 ? "#f0fdf4" : "#fffbeb", borderRadius: 12, padding: 24, border: `1px solid ${totalPct >= 75 ? "#bbf7d0" : "#fde68a"}`, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: totalPct >= 75 ? "#10b981" : "#d97706", marginBottom: 4 }}>TỶ LỆ CHÍNH XÁC</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>tổng hợp</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: totalPct >= 75 ? "#047857" : "#b45309" }}>{totalPct}%</div>
            </div>
            {/* Ô 4: Số lần làm — click để xem chi tiết */}
            {exHistory.length > 0 && (
              <div
                onClick={() => setSelectedSession(selectedSession !== null ? null : 0)}
                style={{
                  background: selectedSession !== null ? "#f5f3ff" : "#faf5ff",
                  borderRadius: 12, padding: 24,
                  border: `2px solid ${selectedSession !== null ? "#7c3aed" : "#ddd6fe"}`,
                  textAlign: "center", cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: selectedSession !== null ? "0 0 0 3px #ede9fe" : "none",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed", marginBottom: 8 }}>SỐ LẦN LÀM BÀI</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#6d28d9" }}>{exHistory.length}</div>
                <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 6 }}>
                  {selectedSession !== null ? "▲ Đang xem chi tiết" : "▼ Bấm để xem chi tiết"}
                </div>
              </div>
            )}
          </div>

          {/* Panel chi tiết từng lần làm */}
          {selectedSession !== null && exHistory.length > 0 && (
            <div style={{ marginTop: 24, border: "1px solid #ede9fe", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ background: "#f5f3ff", padding: "12px 20px", borderBottom: "1px solid #ede9fe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#5b21b6" }}>📋 Chi tiết từng lần làm bài</span>
                <button
                  onClick={() => setSelectedSession(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", fontWeight: 700, fontSize: 18, lineHeight: 1 }}
                >×</button>
              </div>
              {/* Danh sách lần làm */}
              <div style={{ display: "flex", gap: 0, overflowX: "auto", borderBottom: "1px solid #ede9fe" }}>
                {exHistory.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSession(i)}
                    style={{
                      padding: "10px 20px", border: "none", borderRight: "1px solid #ede9fe",
                      background: selectedSession === i ? "#7c3aed" : "#fff",
                      color: selectedSession === i ? "#fff" : "#6d28d9",
                      cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              {/* Chi tiết lần được chọn */}
              {(() => {
                const s = exHistory[selectedSession];
                return (
                  <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 20, textAlign: "center", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>TỔNG CÂU</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#1e293b" }}>{s.total}</div>
                    </div>
                    <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 20, textAlign: "center", border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#10b981", marginBottom: 6 }}>✅ TRẢ LỜI ĐÚNG</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#047857" }}>{s.correct}</div>
                    </div>
                    <div style={{ background: "#fef2f2", borderRadius: 10, padding: 20, textAlign: "center", border: "1px solid #fca5a5" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", marginBottom: 6 }}>❌ TRẢ LỜI SAI</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#b91c1c" }}>{s.wrong}</div>
                    </div>
                    <div style={{
                      background: s.score >= 80 ? "#f0fdf4" : s.score >= 60 ? "#fffbeb" : "#fef2f2",
                      borderRadius: 10, padding: 20, textAlign: "center",
                      border: `1px solid ${s.score >= 80 ? "#bbf7d0" : s.score >= 60 ? "#fde68a" : "#fca5a5"}`
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.score >= 80 ? "#10b981" : s.score >= 60 ? "#d97706" : "#ef4444", marginBottom: 6 }}>TỶ LỆ ĐÚNG</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: s.score >= 80 ? "#047857" : s.score >= 60 ? "#b45309" : "#b91c1c" }}>{s.score}%</div>
                      <div style={{ fontSize: 11, marginTop: 4, color: "#64748b" }}>
                        {s.score >= 80 ? "🏆 Xuất sắc" : s.score >= 60 ? "📚 Khá" : "💪 Cần cố gắng"}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        );
      })() : null}

      {/* Biểu đồ đánh giá qua từng lần làm bài ôn luyện */}
      {exHistory.length > 0 && (
        <div className="uni-card" style={{ marginBottom: 32, padding: 32, background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)", border: "1px solid #c7d2fe" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e1b4b" }}>
                📈 Đánh giá tiến bộ qua từng lần ôn luyện
              </h3>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6366f1" }}>
                Biểu đồ tỷ lệ trả lời đúng của bài tập ôn luyện kiến thức
              </p>
            </div>
            {/* Badge tổng quát */}
            {(() => {
              const last = exHistory[exHistory.length - 1]?.score ?? 0;
              const trend = exHistory.length >= 2
                ? exHistory[exHistory.length - 1].score - exHistory[0].score
                : null;
              return (
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px",
                    borderRadius: 30, fontWeight: 700, fontSize: 13,
                    background: last >= 80 ? "#dcfce7" : last >= 60 ? "#fef9c3" : "#fee2e2",
                    color: last >= 80 ? "#15803d" : last >= 60 ? "#a16207" : "#b91c1c",
                    border: `1px solid ${last >= 80 ? "#86efac" : last >= 60 ? "#fde047" : "#fca5a5"}`,
                  }}>
                    <span style={{ fontSize: 16 }}>{last >= 80 ? "🏆" : last >= 60 ? "📚" : "💪"}</span>
                    {last >= 80 ? "Xuất sắc" : last >= 60 ? "Khá tốt" : "Cần cố gắng"}
                  </div>
                  {trend !== null && (
                    <div style={{ marginTop: 6, fontSize: 12, color: trend >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                      {trend >= 0 ? `▲ Tăng ${trend.toFixed(1)}%` : `▼ Giảm ${Math.abs(trend).toFixed(1)}%`} so với lần đầu
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={exHistory.map((s, i) => ({
                name: s.name,
                "Điểm (%)": s.score,
                index: i + 1,
              }))}
              margin={{ top: 16, right: 24, bottom: 8, left: -10 }}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e0e7ff" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6366f1", fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #c7d2fe",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.15)",
                  fontWeight: 600,
                  background: "#fff",
                }}
                formatter={(value) => {
                  const label = value >= 80 ? "🏆 Xuất sắc" : value >= 60 ? "📚 Khá" : "💪 Cần cải thiện";
                  return [`${value}%  ${label}`, "Tỷ lệ đúng"];
                }}
                labelStyle={{ color: "#4338ca", fontWeight: 700 }}
              />
              <Line
                type="monotone"
                dataKey="Điểm (%)"
                stroke="url(#lineGradient)"
                strokeWidth={3.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const score = payload["Điểm (%)"];
                  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
                  return (
                    <circle
                      key={`dot-${cx}-${cy}`}
                      cx={cx} cy={cy} r={7}
                      fill="#fff"
                      stroke={color}
                      strokeWidth={3}
                    />
                  );
                }}
                activeDot={{ r: 10, fill: "#6366f1", stroke: "#fff", strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Legend màu điểm */}
          <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { color: "#10b981", label: "Xuất sắc (≥ 80%)" },
              { color: "#f59e0b", label: "Khá (60–79%)" },
              { color: "#ef4444", label: "Cần cải thiện (< 60%)" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color, border: "2px solid #fff", boxShadow: `0 0 0 2px ${item.color}44` }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
