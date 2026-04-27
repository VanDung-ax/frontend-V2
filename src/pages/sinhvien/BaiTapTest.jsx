import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getTamLyRandom, submitTamLy, repredictStudent, getAllResults } from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  MdCheckCircle, MdCancel, MdQuiz, MdRefresh,
  MdSend, MdTrendingDown, MdTrendingUp, MdAutoAwesome
} from "react-icons/md";

const OPTION_LABELS = ["A", "B", "C", "D"];

const customStyles = `
  .quiz-option {
    transition: all 0.2s ease;
  }
  .quiz-option:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    border-color: #93c5fd !important;
  }
  .premium-card {
    background: #fff;
    border-radius: 24px;
    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.025);
    border: 1px solid #f1f5f9;
    transition: transform 0.3s ease;
  }
  .start-banner {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    box-shadow: 0 20px 40px -10px rgba(56, 189, 248, 0.15);
  }
  .premium-input {
    transition: all 0.2s ease;
  }
  .premium-input:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
  }
  .gradient-text {
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

function QuizCard({ question, index, selectedIdx, onSelect, result }) {
  const done = result !== undefined;
  const correctIdx = done ? result.correct_index : null;

  return (
    <div className="premium-card" style={{
      overflow: "hidden", marginBottom: 20
    }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", background: "rgba(248, 250, 252, 0.5)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", marginBottom: 6, textTransform: "uppercase" }}>
          Câu {index + 1} • {question.thuoc_tinh}
        </div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#1e293b", lineHeight: 1.5 }}>
          {question.question}
        </p>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {(question.options || []).map((opt, idx) => {
          let bg = "#f8fafc", border = "#e2e8f0", color = "#374151";
          
          if (done) {
            if (idx === correctIdx) { bg = "#ecfdf5"; border = "#6ee7b7"; color = "#065f46"; }
            else if (idx === selectedIdx && !result.is_correct) { bg = "#fef2f2"; border = "#fca5a5"; color = "#991b1b"; }
          } else if (selectedIdx === idx) { bg = "#eff6ff"; border = "#93c5fd"; color = "#1d4ed8"; }

          return (
            <button
              key={idx}
              className="quiz-option"
              disabled={done}
              onClick={() => onSelect(question.id, idx)}
              style={{
                width: "100%", textAlign: "left", background: bg,
                border: `1.5px solid ${border}`, borderRadius: 10,
                padding: "10px 14px", cursor: done ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 10, color
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: "50%",
                background: (done && idx === correctIdx) ? "#10b981" :
                  (done && idx === selectedIdx && !result.is_correct) ? "#ef4444" :
                  (selectedIdx === idx) ? "#3b82f6" : "#e2e8f0",
                color: (done && (idx === correctIdx || (idx === selectedIdx && !result.is_correct))) || selectedIdx === idx ? "#fff" : "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 13, flexShrink: 0
              }}>
                {OPTION_LABELS[idx]}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{opt}</span>
            </button>
          );
        })}

        {done && (
          <div style={{
            marginTop: 8, padding: "14px 16px", borderRadius: 12,
            background: result.is_correct ? "#f0fdf4" : "#fff7ed",
            border: `1px solid ${result.is_correct ? "#86efac" : "#fed7aa"}`,
            display: "flex", gap: 10, alignItems: "flex-start"
          }}>
            {result.is_correct
              ? <MdCheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
              : <MdTrendingDown size={20} color="#f97316" style={{ flexShrink: 0, marginTop: 1 }} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: result.is_correct ? "#166534" : "#c2410c", marginBottom: 4 }}>
                {result.is_correct ? "Chính xác! 🎉" : "Chưa đúng — Giải thích:"}
              </div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                {result.explanation}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BaiTapTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mssv = user?.linked_id;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [repredicting, setRepredicting] = useState(false);
  const [repredResult, setRepredResult] = useState(null);
  const [showRepredict, setShowRepredict] = useState(false);

  const [repredForm, setRepredForm] = useState({
    thoi_gian_tu_hoc: 0, chuyen_can: 0, diem_qua_trinh: 0,
    hoan_thanh_bai_tap: 0, tre_hoc: 0,
    loai_mon_hoc: "Đại cương", tai_lieu_on_tap: "Có",
    hinh_thuc_thi: "Tự luận", tre_hoc_phi: "Không",
    ho_tro: "Có", hoc_nhom: "Có", lam_them: "Không",
    co_kinh_nghiem: "Không"
  });

  const startTest = async () => {
    setHasStarted(true);
    setLoading(true);
    try {
      const res = await getTamLyRandom(mssv);
      setQuestions(res.data.questions || []);
      setAnswers({});
      setResults(null);
    } catch (e) {
      console.error("Lỗi tải câu hỏi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadStudentData() {
      if (!mssv) return;
      try {
        const res = await getAllResults(user?.id, 'khoa');
        const raw = res.data || [];
        const mine = raw.filter(r => String(r.MSSV) === String(mssv));
        if (mine.length > 0) {
          const latest = mine.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
          setRepredForm({
            thoi_gian_tu_hoc: latest.thoi_gian_tu_hoc ?? 0,
            chuyen_can: latest.chuyen_can ?? 0,
            diem_qua_trinh: latest.diem_qua_trinh ?? 0,
            hoan_thanh_bai_tap: latest.hoan_thanh_bai_tap ?? 0,
            tre_hoc: latest.tre_hoc ?? 0,
            loai_mon_hoc: latest.loai_mon_hoc || "Đại cương",
            tai_lieu_on_tap: latest.tai_lieu_on_tap || "Có",
            hinh_thuc_thi: latest.hinh_thuc_thi || "Tự luận",
            tre_hoc_phi: latest.tre_hoc_phi || "Không",
            ho_tro: latest.ho_tro || "Có",
            hoc_nhom: latest.hoc_nhom || "Có",
            lam_them: latest.lam_them || "Không",
            co_kinh_nghiem: latest.co_kinh_nghiem || "Không"
          });
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu khởi tạo:", err);
      }
    }
    loadStudentData();
  }, [mssv, user]);

  const handleSelectAnswer = (qId, optIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm("Bạn chưa hoàn thành tất cả câu hỏi. Vẫn muốn nộp bài?")) return;
    }
    
    setSubmitting(true);
    try {
      const res = await submitTamLy(mssv, answers);
      setResults(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      alert("Lỗi khi nộp bài: " + (e.response?.data?.detail || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepredict = async () => {
    setRepredicting(true);
    try {
      const res = await repredictStudent(mssv, {
        ...repredForm,
        parent_result_id: null
      });
      setRepredResult(res.data);
    } catch (e) {
      alert("Lỗi dự báo lại: " + (e.response?.data?.detail || e.message));
    } finally {
      setRepredicting(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );

  if (!hasStarted) return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 0" }}>
      <style>{customStyles}</style>
      <div className="page-header" style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 className="gradient-text" style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Khảo sát Tâm lý & Thói quen</h1>
        <p style={{ color: "#64748b", fontSize: 16 }}>
          Bài khảo sát giúp nhận diện và cải thiện kỹ năng quản lý thời gian, phương pháp học tập.
        </p>
      </div>
      <div className="premium-card start-banner" style={{ borderRadius: 28, padding: "56px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 20, filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))" }}>🧠</div>
        <h2 className="gradient-text" style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Kiểm tra Tâm lý Học tập</h2>
        <p style={{ color: "#475569", marginBottom: 36, fontSize: 16, lineHeight: 1.6, maxWidth: 480, margin: "0 auto 36px" }}>
          Hệ thống sẽ lấy ngẫu nhiên 30 câu hỏi từ ngân hàng câu hỏi để kiểm tra phương pháp học và trạng thái tâm lý của bạn.
        </p>
        <button 
          onClick={startTest}
          style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)", color: "#fff", border: "none", borderRadius: 14, padding: "18px 48px", fontSize: 17, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)", transition: "transform 0.2s" }}
          onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
        >
          Tôi muốn làm bài ngay
        </button>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 0" }}>
      <style>{customStyles}</style>
      <div className="page-header" style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 className="gradient-text" style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Khảo sát Tâm lý & Thói quen</h1>
      </div>
      <div className="premium-card" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: "#166534", fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Không có khảo sát nào!</h2>
        <p style={{ color: "#15803d", fontSize: 16 }}>Bạn đã làm hết ngân hàng câu hỏi hoặc tâm lý bạn đang rất tốt.</p>
      </div>
    </div>
  );

  const NUMERIC_FIELDS = [
    { key: "thoi_gian_tu_hoc", label: "Giờ tự học/tuần", min: 0, max: 40 },
    { key: "chuyen_can", label: "Chuyên cần (%)", min: 0, max: 100 },
    { key: "diem_qua_trinh", label: "Điểm quá trình (0-10)", min: 0, max: 10 },
    { key: "hoan_thanh_bai_tap", label: "Hoàn thành bài tập (%)", min: 0, max: 100 },
    { key: "tre_hoc", label: "Số lần trễ học", min: 0, max: 30 }
  ];
  const YESNO_FIELDS = [
    { key: "loai_mon_hoc", label: "Loại môn học", options: ["Đại cương", "Chuyên ngành", "Thực hành", "Tự chọn"] },
    { key: "tai_lieu_on_tap", label: "Có tài liệu ôn tập", options: ["Có", "Không"] },
    { key: "hinh_thuc_thi", label: "Hình thức thi", options: ["Tự luận", "Trắc nghiệm", "Thực hành", "Vấn đáp"] },
    { key: "tre_hoc_phi", label: "Trễ học phí", options: ["Có", "Không"] },
    { key: "ho_tro", label: "Có hỗ trợ học tập", options: ["Có", "Không"] },
    { key: "hoc_nhom", label: "Học nhóm", options: ["Có", "Không"] },
    { key: "lam_them", label: "Làm thêm ngoài giờ", options: ["Có", "Không"] },
    { key: "co_kinh_nghiem", label: "Có kinh nghiệm thực tế", options: ["Có", "Không"] }
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 64, paddingTop: 16 }}>
      <style>{customStyles}</style>
      <div className="page-header" style={{ marginBottom: 36, textAlign: "center" }}>
        <h1 className="gradient-text" style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Khảo sát Tâm lý & Thói quen</h1>
        <p style={{ color: "#64748b", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
          Hoàn thành bảng khảo sát này để nhận diện và cải thiện kỹ năng quản lý thời gian, tâm lý học tập.
        </p>
      </div>

      {results && (
        <div style={{
          background: results.score_percent >= 80 ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #f59e0b, #d97706)",
          borderRadius: 20, padding: "32px", marginBottom: 24,
          color: "#fff", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 8 }}>{results.score_percent}%</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {results.score_percent >= 80 ? "🎉 Tuyệt vời! Tâm lý và thói quen học tập của bạn rất vững." : "Hãy xem kỹ các giải thích bên dưới để cải thiện phương pháp học nhé."}
          </div>
          {results.score_percent >= 80 && (
            <div style={{ marginTop: 24, padding: "20px", background: "rgba(255,255,255,0.15)", borderRadius: 12 }}>
              <p style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>
                💡 Vì tâm lý của bạn rất ổn định, hệ thống cho rằng bạn chỉ đang bị "hổng" kiến thức môn học. Hãy chuyển sang phần Luyện tập AI để lấp lỗ hổng chuyên môn, đồng thời dự báo lại để Phòng Đào Tạo cập nhật hồ sơ!
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button 
                  onClick={() => setShowRepredict(!showRepredict)}
                  style={{ background: "#fff", color: "#065f46", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
                >
                  {showRepredict ? "Ẩn form dự báo" : "Dự báo lại (Hạ rủi ro)"}
                </button>
                <button 
                  onClick={() => navigate("/sinhvien/bai-tap-ai")}
                  style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <MdAutoAwesome /> Luyện bài tập AI
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showRepredict && results?.score_percent >= 80 && (
        <div className="premium-card" style={{ marginBottom: 36, border: "2px solid #10b981", padding: 36, boxShadow: "0 10px 30px rgba(16, 185, 129, 0.15)" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: "#065f46", display: "flex", alignItems: "center", gap: 10 }}>
            <MdTrendingUp size={28} /> 📝 Cập nhật thông số để gửi Phòng Đào Tạo
          </h3>
          <p style={{ color: "#475569", marginBottom: 24 }}>Bạn có tâm lý tốt, hãy điền lại thông số để Phòng Đào Tạo nắm bắt tình hình và hạ rủi ro của bạn.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {NUMERIC_FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 14, fontWeight: 700, color: "#334155", display: "block", marginBottom: 8 }}>{f.label}</label>
                <input
                  type="number" min={f.min} max={f.max} step={f.key === "diem_qua_trinh" ? 0.1 : 1}
                  value={repredForm[f.key]}
                  onChange={e => setRepredForm(p => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))}
                  className="premium-input"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 15, outline: "none", background: "#f8fafc" }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {YESNO_FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 14, fontWeight: 700, color: "#334155", display: "block", marginBottom: 8 }}>{f.label}</label>
                <select
                  value={repredForm[f.key]}
                  onChange={e => setRepredForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="premium-input"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 15, outline: "none", background: "#f8fafc" }}
                >
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={handleRepredict}
            disabled={repredicting}
            style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 800, fontSize: 15, cursor: repredicting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 10 }}
          >
            {repredicting ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <MdSend />} Gửi cập nhật
          </button>

          {repredResult && (
            <div style={{ marginTop: 24, padding: 24, background: "#f0fdf4", borderRadius: 16, border: "1px solid #86efac" }}>
              <h4 style={{ margin: "0 0 16px", fontWeight: 800, color: "#166534" }}>📊 Kết quả dự báo mới</h4>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <div style={{ textAlign: "center", background: "#fff", borderRadius: 12, padding: "16px 32px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: repredResult.risk_score >= 0.65 ? "#ef4444" : repredResult.risk_score >= 0.4 ? "#f59e0b" : "#10b981" }}>
                    {repredResult.risk_score_percent}%
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Rủi ro mới</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 6 }}>
                    Mức độ: <span style={{ color: repredResult.risk_level === "CAO" ? "#ef4444" : "#f59e0b" }}>{repredResult.risk_level}</span>
                  </div>
                  {repredResult.warning_reasons?.length > 0 ? (
                    <div>
                      {repredResult.warning_reasons.map((r, i) => (
                        <span key={i} style={{ display: "inline-block", background: "#fef3c7", color: "#92400e", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, marginRight: 6, marginBottom: 4 }}>{r}</span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#10b981", fontWeight: 700 }}>🎉 Bạn đã hoàn toàn an toàn!</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        {questions.map((q, i) => (
          <QuizCard 
            key={q.id} 
            question={q} 
            index={i} 
            selectedIdx={answers[q.id]}
            onSelect={handleSelectAnswer}
            result={results?.results?.[q.id]}
          />
        ))}
      </div>

      {!results && questions.length > 0 && (
        <div className="premium-card" style={{ marginTop: 32, padding: 32, textAlign: "center", background: "#f8fafc" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, color: "#1e293b" }}>Đã hoàn thành các câu hỏi?</h3>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: 15 }}>Hãy nộp bài để hệ thống phân tích và chấm điểm độ vững tâm lý của bạn.</p>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#fff", border: "none", borderRadius: 14, padding: "18px 48px",
              fontSize: 17, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 10px 25px rgba(37, 99, 235, 0.3)", transition: "transform 0.2s", display: "inline-flex", alignItems: "center", gap: 10
            }}
            onMouseOver={e => !submitting && (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={e => !submitting && (e.currentTarget.style.transform = "scale(1)")}
          >
            {submitting ? <div className="spinner" style={{ width: 20, height: 20 }}/> : <MdCheckCircle size={24} />}
            Nộp bài khảo sát
          </button>
        </div>
      )}
    </div>
  );
}
