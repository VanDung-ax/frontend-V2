import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getProgress, getExercises, getTamLyStats, getExerciseHistory } from "../../services/api";
import {
  MdTrendingUp, MdTrendingDown, MdRemove, MdRefresh, MdWarningAmber, MdCheckCircle
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
    <div className="uni-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>So sánh các chỉ số</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Đối chiếu dữ liệu ban đầu và hiện tại</p>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {[{ c: "#16a34a", l: "Cải thiện" }, { c: "#dc2626", l: "Suy giảm" }, { c: "#94a3b8", l: "Giữ nguyên" }].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.c }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{t.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {["TIÊU CHÍ ĐÁNH GIÁ", "DỮ LIỆU BAN ĐẦU", "DỮ LIỆU HIỆN TẠI", "MỨC ĐỘ THAY ĐỔI"].map((h, i) => (
                <th key={h} style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: 0.5, borderBottom: "2px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const delta = r.isNumeric && r.v1 !== null && r.v2 !== null ? r.v2 - r.v1 : null;
              const rowBg = r.improved === true ? "#f0fdf4" : r.improved === false ? "#fef2f2" : "#fff";
              return (
                <tr key={r.key} style={{ background: rowBg, borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: "#334155" }}>{r.label}</td>
                  <td style={{ padding: "16px 24px", fontSize: 14, color: "#64748b" }}>
                    {r.v1 !== null ? (r.isNumeric ? Number(r.v1).toFixed(r.key === "diem_qua_trinh" ? 1 : 0) : r.v1) : "—"}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                    {r.v2 !== null ? (r.isNumeric ? Number(r.v2).toFixed(r.key === "diem_qua_trinh" ? 1 : 0) : r.v2) : "—"}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {delta !== null && r.changed ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: r.improved ? "#16a34a" : "#dc2626" }}>
                        {r.improved ? <MdTrendingUp size={18} /> : <MdTrendingDown size={18} />}
                        {delta > 0 ? "+" : ""}{delta.toFixed(r.key === "diem_qua_trinh" ? 1 : 0)}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
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
    </div>
  );
}

export default function TienBoSoSanh() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [exercises, setExercises] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tamLyStats, setTamLyStats] = useState(null);
  const [exHistory, setExHistory] = useState([]);
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
      {exercises && exercises.done_count > 0 && (
        <div className="uni-card" style={{ padding: 32, marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Thống kê rèn luyện AI</h3>
            {exercises.done_count >= 2 && exercises.score_percent >= 80 && (
              <span className="uni-badge uni-badge-success" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 12px" }}>
                <MdCheckCircle size={16} /> Đánh giá: Tiến bộ hơn
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            <div style={{ background: "#eff6ff", borderRadius: 12, padding: 24, border: "1px solid #bfdbfe", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#3b82f6", marginBottom: 8 }}>BÀI TẬP ĐÃ LÀM</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#1d4ed8" }}>{exercises.done_count}</div>
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 24, border: "1px solid #bbf7d0", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#10b981", marginBottom: 8 }}>TRẢ LỜI ĐÚNG</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#047857" }}>{exercises.correct_count}</div>
            </div>
            <div style={{ background: exercises.score_percent >= 75 ? "#f0fdf4" : "#fffbeb", borderRadius: 12, padding: 24, border: `1px solid ${exercises.score_percent >= 75 ? "#bbf7d0" : "#fde68a"}`, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: exercises.score_percent >= 75 ? "#10b981" : "#d97706", marginBottom: 8 }}>TỶ LỆ CHÍNH XÁC</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: exercises.score_percent >= 75 ? "#047857" : "#b45309" }}>{exercises.score_percent}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Improvement banner */}
      {improvement && (
        <div style={{
          borderRadius: 12, padding: 32, marginBottom: 32,
          background: improvement.is_improved ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${improvement.is_improved ? "#bbf7d0" : "#fca5a5"}`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{ padding: 16, background: improvement.is_improved ? "#16a34a" : "#dc2626", borderRadius: "50%", color: "#fff", display: "flex" }}>
              {improvement.is_improved ? <MdTrendingUp size={32} /> : <MdTrendingDown size={32} />}
            </div>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: improvement.is_improved ? "#15803d" : "#b91c1c" }}>
                {improvement.is_improved
                  ? `TUYỆT VỜI! MỨC ĐỘ RỦI RO ĐÃ GIẢM ${improvement.delta_percent}%`
                  : `CẢNH BÁO! MỨC ĐỘ RỦI RO TĂNG THÊM ${Math.abs(improvement.delta_percent)}%`}
              </h2>
              <p style={{ margin: 0, color: "#475569", fontSize: 16, lineHeight: 1.5 }}>
                Tỷ lệ rủi ro của bạn đã thay đổi từ <strong>{improvement.first_score}%</strong> (ban đầu) thành <strong>{improvement.last_score}%</strong> (hiện tại) sau <strong>{improvement.sessions_count}</strong> lần đánh giá.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk trend chart - line chart */}
      {exHistory.length > 0 && (
        <div className="uni-card" style={{ marginBottom: 32, padding: 32 }}>
          <h3 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Biểu đồ điểm số Bài tập AI</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exHistory.map(s => ({
                name: s.name,
                "Tỷ lệ chính xác": s.score
              }))} margin={{ top: 10, right: 20, bottom: 10, left: -20 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 600 }}
                  formatter={(value) => [`${value}%`, "Tỷ lệ chính xác"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="Tỷ lệ chính xác" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
                  dot={{ r: 5, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Compare table */}
      {history.length >= 2 && (
        <CompareTable history={history} />
      )}
    </div>
  );
}
