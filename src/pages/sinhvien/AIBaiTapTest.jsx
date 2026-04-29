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
    background: rgba(0, 240, 255, 0.05);
    border: 1px solid var(--cyber-border);
    color: var(--cyber-text);
  }
  .quiz-option:not(:disabled):hover {
    transform: translateX(4px);
    box-shadow: inset 0 0 10px rgba(0, 240, 255, 0.1);
    border-color: var(--cyber-accent);
  }
  .quiz-option.selected {
    background: rgba(0, 240, 255, 0.1);
    border-color: var(--cyber-accent);
    box-shadow: var(--cyber-accent-glow);
  }
  .quiz-option.correct {
    background: rgba(0, 255, 157, 0.1) !important;
    border-color: var(--cyber-success) !important;
    box-shadow: var(--cyber-success-glow) !important;
  }
  .quiz-option.wrong {
    background: rgba(255, 0, 85, 0.1) !important;
    border-color: var(--cyber-danger) !important;
    box-shadow: inset 0 0 10px rgba(255, 0, 85, 0.2) !important;
  }
`;

function AIQuizCard({ question, index, onSelect, selectedIdx, result }) {
  const options = Object.values(question.dap_an);
  const correctIdx = options.indexOf(question.lua_chon_dung);
  
  return (
    <div className="cyber-card" style={{ padding: 0, marginBottom: 20, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--cyber-border)", background: "rgba(0, 240, 255, 0.02)" }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: "var(--cyber-accent)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
          SEQ_{index + 1}
        </div>
        <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, color: "var(--cyber-text)", lineHeight: 1.5 }}>
          {question.cau_hoi}
        </p>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((opt, idx) => {
          let extraClass = "";
          let iconColor = "var(--cyber-text-muted)";
          
          if (result) {
            if (idx === correctIdx) { extraClass = "correct"; iconColor = "var(--cyber-success)"; }
            else if (idx === selectedIdx && idx !== correctIdx) { extraClass = "wrong"; iconColor = "var(--cyber-danger)"; }
          } else if (selectedIdx === idx) { extraClass = "selected"; iconColor = "var(--cyber-accent)"; }

          return (
            <button
              key={idx}
              disabled={result !== null}
              className={`quiz-option ${extraClass}`}
              onClick={() => onSelect(index, idx)}
              style={{
                width: "100%", textAlign: "left",
                borderRadius: 4, padding: "12px 16px", cursor: result ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 12
              }}
            >
              <span style={{
                width: 24, height: 24,
                border: `1px solid ${iconColor}`,
                color: iconColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: 'var(--font-mono)', fontSize: 12, flexShrink: 0,
                boxShadow: extraClass ? `0 0 8px ${iconColor}` : 'none'
              }}>
                {OPTION_LABELS[idx]}
              </span>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', flex: 1 }}>{opt}</span>
            </button>
          );
        })}

        {result && (
          <div style={{
            marginTop: 8, padding: "14px 16px", borderRadius: 4,
            background: result.is_correct ? "rgba(0, 255, 157, 0.05)" : "rgba(255, 183, 3, 0.05)",
            border: `1px solid ${result.is_correct ? "var(--cyber-success)" : "var(--cyber-warning)"}`,
            display: "flex", gap: 10, alignItems: "flex-start"
          }}>
            {result.is_correct
              ? <MdCheckCircle size={20} color="var(--cyber-success)" style={{ flexShrink: 0, marginTop: 1 }} />
              : <MdTrendingDown size={20} color="var(--cyber-warning)" style={{ flexShrink: 0, marginTop: 1 }} />}
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: result.is_correct ? "var(--cyber-success)" : "var(--cyber-warning)", marginBottom: 4 }}>
                {result.is_correct ? "MATCH_FOUND_CORRECT" : "ANOMALY_DETECTED // EXPLANATION:"}
              </div>
              <div style={{ fontSize: 13, color: "var(--cyber-text-muted)", lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
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
    <div style={{ paddingBottom: 48, maxWidth: 760, margin: "0 auto" }}>
      <style>{customStyles}</style>
      <div style={{ marginBottom: 32, textAlign: "center", paddingTop: 16 }}>
        <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: "var(--cyber-accent)", textShadow: "var(--cyber-accent-glow)", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <MdAutoAwesome /> NEURAL_TRAINING_GROUND
        </h1>
        <p style={{ color: "var(--cyber-text-muted)", fontSize: 14, fontFamily: 'var(--font-mono)' }}>
          AI-driven knowledge patching sequence. Score &gt; 75% to trigger risk parameter reset.
        </p>
      </div>

      {step === 'setup' && (
        <div className="cyber-card" style={{ padding: "48px 32px", border: "1px solid var(--cyber-accent)", boxShadow: "inset 0 0 50px rgba(0, 240, 255, 0.05)", textAlign: "center" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16, textShadow: "var(--cyber-accent-glow)" }}>🚀</div>
            <h2 style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: "var(--cyber-text)", marginBottom: 16 }}>READY_FOR_CALIBRATION?</h2>
            <p style={{ color: "var(--cyber-text-muted)", fontSize: 14, maxWidth: 560, margin: "0 auto", lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
              Core system will generate localized testing protocols for <strong>{monHoc || "chuyên ngành"}</strong> to address detected anomalies. Progression will be logged.
            </p>
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={loadingAI}
            className="cyber-btn cyber-btn-primary"
            style={{ 
              padding: "18px 40px", 
              fontSize: 16, cursor: loadingAI ? "not-allowed" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 12
            }}
          >
            {loadingAI ? <div className="spinner" style={{width:24, height:24, borderColor: 'var(--cyber-bg)', borderTopColor: 'transparent'}}/> : <><MdAutoAwesome size={24} /> INITIALIZE_TRAINING_MODULE</>}
          </button>
        </div>
      )}

      {(step === 'playing' || step === 'result') && (
        <div>
          {step === 'result' && (
            <div className="cyber-card" style={{
              background: score >= 75 ? "rgba(0, 255, 157, 0.05)" : "rgba(255, 183, 3, 0.05)",
              border: `1px solid ${score >= 75 ? "var(--cyber-success)" : "var(--cyber-warning)"}`,
              padding: "32px", marginBottom: 24, textAlign: "center",
              boxShadow: score >= 75 ? "inset 0 0 30px rgba(0, 255, 157, 0.1)" : "inset 0 0 30px rgba(255, 183, 3, 0.1)"
            }}>
              <div style={{ fontSize: 48, fontFamily: 'var(--font-display)', color: score >= 75 ? "var(--cyber-success)" : "var(--cyber-warning)", marginBottom: 8, textShadow: score >= 75 ? "var(--cyber-success-glow)" : "none" }}>{score}%</div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: "var(--cyber-text)" }}>
                {score >= 75 ? "STATUS: CALIBRATION_COMPLETE // Ready for parameter override." : "STATUS: SUB_OPTIMAL // Threshold 75% required."}
              </div>
              <button 
                onClick={() => setStep('setup')}
                className="cyber-btn"
                style={{ marginTop: 16 }}
              >
                REQUEST_NEW_MODULE
              </button>
            </div>
          )}

          {step === 'result' && score >= 75 && (
            <div className="cyber-card" style={{ background: "rgba(0, 255, 157, 0.05)", border: "1px solid var(--cyber-success)", padding: 32, marginBottom: 24, boxShadow: "inset 0 0 20px rgba(0, 255, 157, 0.1)", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16, textShadow: "var(--cyber-success-glow)" }}>🎉</div>
              <h3 style={{ margin: "0 0 12px", fontSize: 20, fontFamily: 'var(--font-display)', color: "var(--cyber-success)" }}>
                PROGRESSION_LOGGED
              </h3>
              <p style={{ color: "var(--cyber-success)", margin: 0, fontSize: 14, fontFamily: 'var(--font-mono)' }}>
                System recorded positive vector changes. Academic trajectory updated.
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
            <div className="cyber-card" style={{ marginTop: 24, textAlign: "center" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, fontFamily: 'var(--font-display)', color: "var(--cyber-text)" }}>MODULE_COMPLETE?</h3>
              <p style={{ color: "var(--cyber-text-muted)", marginBottom: 24, fontSize: 13, fontFamily: 'var(--font-mono)' }}>Submit data for evaluation.</p>
              <button 
                onClick={handleGrade}
                className="cyber-btn cyber-btn-primary"
                style={{ padding: "16px 40px", display: "inline-flex", alignItems: "center" }}
              >
                <MdCheckCircle style={{ marginRight: 8 }} size={20} />
                SUBMIT_MODULE
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
