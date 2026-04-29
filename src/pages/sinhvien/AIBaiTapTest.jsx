import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { generateAIQuiz, repredictStudent, getStudent, submitAnswer, getProgress } from "../../services/api";
import {
  MdCheckCircle, MdCancel, MdQuiz, MdRefresh,
  MdSend, MdTrendingDown, MdTrendingUp, MdAutoAwesome
} from "react-icons/md";

const OPTION_LABELS = ["A", "B", "C", "D"];

function AIQuizCard({ question, index, onSelect, selectedIdx, result }) {
  const options = Object.values(question.dap_an);
  const correctIdx = options.indexOf(question.lua_chon_dung);
  
  return (
    <div style={{
      background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
      overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      marginBottom: 16
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", marginBottom: 6 }}>
          CÂU {index + 1}
        </div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#1e293b", lineHeight: 1.5 }}>
          {question.cau_hoi}
        </p>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((opt, idx) => {
          let bg = "#f8fafc", border = "#e2e8f0", color = "#374151";
          
          if (result) {
            if (idx === correctIdx) { bg = "#ecfdf5"; border = "#6ee7b7"; color = "#065f46"; }
            else if (idx === selectedIdx && idx !== correctIdx) { bg = "#fef2f2"; border = "#fca5a5"; color = "#991b1b"; }
          } else if (selectedIdx === idx) { bg = "#eff6ff"; border = "#93c5fd"; color = "#1d4ed8"; }

          return (
            <button
              key={idx}
              disabled={result !== null}
              onClick={() => onSelect(index, idx)}
              style={{
                width: "100%", textAlign: "left", background: bg,
                border: `1.5px solid ${border}`, borderRadius: 10,
                padding: "10px 14px", cursor: result ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 10, color
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: "50%",
                background: (result && idx === correctIdx) ? "#10b981" :
                  (result && idx === selectedIdx && idx !== correctIdx) ? "#ef4444" :
                  (selectedIdx === idx) ? "#3b82f6" : "#e2e8f0",
                color: (result && (idx === correctIdx || (idx === selectedIdx && idx !== correctIdx))) || selectedIdx === idx ? "#fff" : "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 13, flexShrink: 0
              }}>
                {OPTION_LABELS[idx]}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{opt}</span>
            </button>
          );
        })}

        {result && (
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
                {question.giai_thich}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIBaiTapTest() {
  const { user } = useAuth();
  const mssv = user?.linked_id;

  // Trạng thái: 'setup', 'playing', 'result'
  const [step, setStep] = useState('setup');
  
  // Setup form
  const [monHoc, setMonHoc] = useState("");
  const [lyDo, setLyDo] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Dữ liệu bài tập
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { 0: 2, 1: 0, ... }
  
  // Kết quả
  const [score, setScore] = useState(0);
  const [graded, setGraded] = useState(false);
  
  // Form dự báo lại
  const [repredicting, setRepredicting] = useState(false);
  const [repredResult, setRepredResult] = useState(null);
  const [repredForm, setRepredForm] = useState({
    thoi_gian_tu_hoc: 0, chuyen_can: 0, diem_qua_trinh: 0,
    hoan_thanh_bai_tap: 0, tre_hoc: 0,
    loai_mon_hoc: "Đại cương", tai_lieu_on_tap: "Có",
    hinh_thuc_thi: "Tự luận", tre_hoc_phi: "Không",
    ho_tro: "Có", hoc_nhom: "Có", lam_them: "Không",
    co_kinh_nghiem: "Không"
  });

  // Lấy dữ liệu thực tế của sinh viên để điền sẵn vào Form
  useEffect(() => {
    async function loadStudentData() {
      if (!mssv) return;
      try {
        const [svRes, progressRes] = await Promise.all([
          getStudent(mssv),
          getProgress(mssv).catch(() => ({ data: { history: [] } }))
        ]);

        if (svRes.data?.Nganh) {
          setMonHoc(svRes.data.Nganh);
        }

        const history = progressRes.data?.history || [];
        if (history.length > 0) {
          const latest = history[history.length - 1];
          
          // Ưu tiên lấy tên môn học thực tế từ bảng môn học
          if (latest.ten_mon_hoc) {
            setMonHoc(latest.ten_mon_hoc);
          }

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
          
          if (latest.warning_reasons && latest.warning_reasons.length > 0) {
            setLyDo("Khắc phục rủi ro: " + latest.warning_reasons.join(", "));
          } else {
            setLyDo("Ôn tập kiến thức chung");
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu khởi tạo:", err);
      }
    }
    loadStudentData();
  }, [mssv, user]);

  const handleGenerate = async () => {
    const finalMonHoc = monHoc || "Kiến thức Đại cương";
    const finalLyDo = lyDo || "Ôn tập củng cố kiến thức chung";
    
    setLoadingAI(true);
    try {
      const res = await generateAIQuiz(mssv, finalMonHoc, finalLyDo);
      if (res.data?.danh_sach_cau_hoi) {
        setQuestions(res.data.danh_sach_cau_hoi);
        setAnswers({});
        setGraded(false);
        setStep('playing');
      } else {
        console.error("Lỗi dữ liệu AI trả về:", res.data);
        alert("AI đang bị quá tải hoặc trả về sai định dạng. Vui lòng bấm thử lại!\nDữ liệu nhận được: " + JSON.stringify(res.data).substring(0, 100));
      }
    } catch (e) {
      alert("Lỗi khi gọi AI API: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSelectAnswer = (qIndex, optIndex) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleGrade = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm("Bạn chưa hoàn thành tất cả câu hỏi. Vẫn muốn nộp bài?")) return;
    }
    
    let correctCount = 0;
    
    // Chấm điểm và lưu kết quả xuống database tuần tự để tránh nghẽn server
    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const options = Object.values(q.dap_an);
      const correctIdx = options.indexOf(q.lua_chon_dung);
      
      if (answers[idx] === correctIdx) correctCount++;
      
      // Lưu kết quả nếu câu hỏi có id và sinh viên có chọn đáp án
      if (q.id && answers[idx] !== undefined) {
        try {
          await submitAnswer(q.id, mssv, answers[idx]);
        } catch (e) {
          console.error(`Lỗi lưu câu ${idx + 1}:`, e);
        }
      }
    }
    
    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setGraded(true);
    setStep('result');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRepredict = async () => {
    setRepredicting(true);
    try {
      const res = await repredictStudent(mssv, { ...repredForm, parent_result_id: null });
      setRepredResult(res.data);
    } catch (e) {
      alert("Lỗi dự báo lại: " + (e.response?.data?.detail || e.message));
    } finally {
      setRepredicting(false);
    }
  };

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
    { key: "hoc_nhom", label: "Học nhóm", options: ["Có", "Không"] }
  ];

  return (
    <div style={{ paddingBottom: 48 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 10 }}>
          <MdAutoAwesome color="#8b5cf6" /> Bài tập Sinh tự động (AI)
        </h1>
        <p style={{ color: "#64748b", marginTop: 4 }}>
          Tạo bài tập tuỳ chỉnh theo môn học và cải thiện điểm dự báo nếu đạt trên 75%.
        </p>
      </div>

      {step === 'setup' && (
        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.05)", textAlign: "center" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>Sẵn sàng luyện tập?</h2>
            <p style={{ color: "#475569", fontSize: 16, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
              Hệ thống sẽ tự động tạo bài tập dựa trên môn học <strong>{monHoc || "chuyên ngành"}</strong> và tập trung khắc phục các rủi ro đã được cảnh báo của bạn. Các bài tập này sẽ được lưu lại để theo dõi tiến độ.
            </p>
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={loadingAI}
            style={{ 
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)", 
              color: "#fff", border: "none", borderRadius: 14, padding: "18px 40px", 
              fontWeight: 800, fontSize: 17, cursor: loadingAI ? "not-allowed" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 12, boxShadow: "0 10px 25px rgba(139, 92, 246, 0.3)",
              transition: "transform 0.2s"
            }}
            onMouseOver={e => !loadingAI && (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={e => !loadingAI && (e.currentTarget.style.transform = "scale(1)")}
          >
            {loadingAI ? <div className="spinner" style={{width:24, height:24}}/> : <><MdAutoAwesome size={26} /> Làm bài tập để ôn kiến thức và cải thiện rủi ro</>}
          </button>
        </div>
      )}

      {(step === 'playing' || step === 'result') && (
        <div>
          {step === 'result' && (
            <div style={{
              background: score >= 75 ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #f59e0b, #d97706)",
              borderRadius: 20, padding: "32px", marginBottom: 24,
              color: "#fff", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
            }}>
              <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 8 }}>{score}%</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {score >= 75 ? "🎉 Tuyệt vời! Bạn đã đủ điều kiện để Cập nhật thông số học tập." : "Cố gắng lên! Bạn cần đạt trên 75% để được đánh giá lại tiến bộ."}
              </div>
              <button 
                onClick={() => setStep('setup')}
                style={{ marginTop: 16, background: "rgba(255,255,255,0.2)", border: "none", padding: "8px 16px", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700 }}
              >
                Làm bài khác
              </button>
            </div>
          )}

          {step === 'result' && score >= 75 && (
            <div style={{ background: "#f0fdf4", borderRadius: 20, border: "1px solid #10b981", padding: 32, marginBottom: 24, boxShadow: "0 4px 16px rgba(16, 185, 129, 0.15)", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h3 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800, color: "#065f46" }}>
                Sinh viên có tiến bộ đáng kể!
              </h3>
              <p style={{ color: "#166534", margin: 0, fontSize: 16 }}>
                Kết quả luyện tập của bạn rất tốt. Hệ thống đã ghi nhận sự tiến bộ này vào hồ sơ học tập của bạn.
              </p>
            </div>
          )}

          <div>
            {questions.map((q, i) => {
              const options = Object.values(q.dap_an);
              const correctIdx = options.indexOf(q.lua_chon_dung);
              const result = graded ? {
                is_correct: answers[i] === correctIdx,
              } : null;

              return (
                <AIQuizCard 
                  key={i} 
                  question={q} 
                  index={i} 
                  selectedIdx={answers[i]}
                  onSelect={handleSelectAnswer}
                  result={result}
                />
              );
            })}
          </div>

          {!graded && questions.length > 0 && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button 
                onClick={handleGrade}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "#fff", border: "none", borderRadius: 12, padding: "16px 40px",
                  fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                }}
              >
                <MdCheckCircle style={{ verticalAlign: "middle", marginRight: 8 }} size={20} />
                Nộp bài và Chấm điểm
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
