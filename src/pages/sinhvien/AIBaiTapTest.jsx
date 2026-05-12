import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { generateAIQuiz, repredictStudent, getStudent, submitAnswer, getProgress } from "../../services/api";
import {
  MdCheckCircle, MdCancel, MdQuiz, MdRefresh,
  MdSend, MdTrendingDown, MdTrendingUp, MdAutoAwesome
} from "react-icons/md";

const OPTION_LABELS = ["A", "B", "C", "D"];

const customStyles = `
  .quiz-option {
    transition: all 0.2s ease;
    background: #fff;
    border: 1px solid #e2e8f0;
    color: #334155;
  }
  .quiz-option:not(:disabled):hover {
    transform: translateX(4px);
    border-color: #3b82f6;
    background: #f8fafc;
  }
  .quiz-option.selected {
    background: #eff6ff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
  .quiz-option.correct {
    background: #f0fdf4 !important;
    border-color: #10b981 !important;
  }
  .quiz-option.wrong {
    background: #fef2f2 !important;
    border-color: #ef4444 !important;
  }
`;

function AIQuizCard({ question, index, onSelect, selectedIdx, result }) {
  const options = Object.values(question.dap_an);
  const correctIdx = options.indexOf(question.lua_chon_dung);
  
  return (
    <div className="uni-card" style={{ padding: 0, marginBottom: 24, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Câu hỏi {index + 1}
        </div>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b", lineHeight: 1.6 }}>
          {question.cau_hoi}
        </p>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {options.map((opt, idx) => {
          let extraClass = "";
          let iconColor = "#94a3b8";
          
          if (result) {
            if (idx === correctIdx) { extraClass = "correct"; iconColor = "#10b981"; }
            else if (idx === selectedIdx && idx !== correctIdx) { extraClass = "wrong"; iconColor = "#ef4444"; }
          } else if (selectedIdx === idx) { extraClass = "selected"; iconColor = "#3b82f6"; }

          return (
            <button
              key={idx}
              disabled={result !== null}
              className={`quiz-option ${extraClass}`}
              onClick={() => onSelect(index, idx)}
              style={{
                width: "100%", textAlign: "left",
                borderRadius: 8, padding: "14px 16px", cursor: result ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 16
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: "50%",
                border: `2px solid ${iconColor}`,
                color: iconColor, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, flexShrink: 0
              }}>
                {OPTION_LABELS[idx]}
              </span>
              <span style={{ fontSize: 15, flex: 1, color: "#334155" }}>{opt}</span>
            </button>
          );
        })}

        {result && (
          <div style={{
            marginTop: 12, padding: "16px", borderRadius: 8,
            background: result.is_correct ? "#f0fdf4" : "#fffbeb",
            border: `1px solid ${result.is_correct ? "#bbf7d0" : "#fde68a"}`,
            display: "flex", gap: 12, alignItems: "flex-start"
          }}>
            {result.is_correct
              ? <MdCheckCircle size={24} color="#16a34a" style={{ flexShrink: 0 }} />
              : <MdTrendingDown size={24} color="#d97706" style={{ flexShrink: 0 }} />}
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: result.is_correct ? "#15803d" : "#b45309", marginBottom: 6 }}>
                {result.is_correct ? "Đáp án chính xác" : "Đáp án chưa chính xác // Lời giải:"}
              </div>
              <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
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
        alert("Hệ thống AI đang bận. Vui lòng thử lại!\nDữ liệu nhận được: " + JSON.stringify(res.data).substring(0, 100));
      }
    } catch (e) {
      alert("Lỗi: " + (e.response?.data?.detail || e.message));
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

  return (
    <div style={{ paddingBottom: 48, maxWidth: 860, margin: "0 auto", paddingTop: 16 }}>
      <style>{customStyles}</style>
      <div style={{ marginBottom: 36, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <MdAutoAwesome color="#2563eb" /> Bài tập rèn luyện AI
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
          Hệ thống sẽ tự động tạo các bài tập luyện tập tùy chỉnh. Cố gắng đạt trên 75% để cải thiện chỉ số đánh giá.
        </p>
      </div>

      {step === 'setup' && (
        <div className="uni-card" style={{ padding: "48px 32px", border: "1px solid #bfdbfe", background: "#f8fafc", textAlign: "center" }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🚀</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Bạn đã sẵn sàng làm bài?</h2>
            <p style={{ color: "#475569", fontSize: 15, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
              Hệ thống AI sẽ sinh ra các bài trắc nghiệm dành riêng cho <strong>{monHoc || "chuyên ngành của bạn"}</strong> để bổ sung phần kiến thức còn thiếu sót. Kết quả sẽ được lưu lại.
            </p>
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={loadingAI}
            className="uni-btn"
            style={{ 
              padding: "16px 40px", 
              fontSize: 16, cursor: loadingAI ? "not-allowed" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 10
            }}
          >
            {loadingAI ? <div className="spinner" style={{width: 24, height: 24, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent'}}/> : <><MdAutoAwesome size={24} /> Tạo bài tập tự động</>}
          </button>
        </div>
      )}

      {(step === 'playing' || step === 'result') && (
        <div>
          {step === 'result' && (
            <div className="uni-card" style={{
              background: score >= 75 ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${score >= 75 ? "#bbf7d0" : "#fde68a"}`,
              padding: "32px", marginBottom: 32, textAlign: "center"
            }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: score >= 75 ? "#16a34a" : "#d97706", marginBottom: 8 }}>{score}%</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
                {score >= 75 ? "Vượt qua thử thách!" : "Chưa đạt yêu cầu (Cần >= 75%)"}
              </div>
              <div style={{ fontSize: 15, color: "#475569" }}>
                {score >= 75 ? "Xin chúc mừng, hệ thống đã ghi nhận điểm số của bạn để tiến hành đánh giá lại." : "Bạn nên xem lại lý thuyết và làm lại bài kiểm tra khác."}
              </div>
              <button 
                onClick={() => setStep('setup')}
                className="uni-btn-outline"
                style={{ marginTop: 24 }}
              >
                Làm bài tập khác
              </button>
            </div>
          )}

          {step === 'result' && score >= 75 && (
            <div className="uni-card" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 32, marginBottom: 32, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, color: "#15803d" }}>
                Ghi nhận tiến bộ
              </h3>
              <p style={{ color: "#16a34a", margin: 0, fontSize: 15, fontWeight: 600 }}>
                Hệ thống đã lưu lại kết quả và đánh dấu cải thiện. Lần dự báo tiếp theo của bạn sẽ có kết quả khả quan hơn!
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
            <div className="uni-card" style={{ marginTop: 32, padding: 32, textAlign: "center" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Hoàn tất làm bài?</h3>
              <p style={{ color: "#64748b", marginBottom: 24, fontSize: 15 }}>Chắc chắn bạn đã chọn tất cả các đáp án trước khi nộp.</p>
              <button 
                onClick={handleGrade}
                className="uni-btn"
                style={{ padding: "16px 48px", display: "inline-flex", alignItems: "center", gap: 10, fontSize: 16 }}
              >
                <MdCheckCircle size={24} />
                Nộp bài
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
