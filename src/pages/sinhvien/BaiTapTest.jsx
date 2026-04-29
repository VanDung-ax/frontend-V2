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

function QuizCard({ question, index, selectedIdx, onSelect, result }) {
  const done = result !== undefined;
  const correctIdx = done ? result.correct_index : null;

  return (
    <div className="cyber-card" style={{ padding: 0, marginBottom: 20, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--cyber-border)", background: "rgba(0, 240, 255, 0.02)" }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: "var(--cyber-accent)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
          SEQ_{index + 1} // {question.thuoc_tinh}
        </div>
        <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, color: "var(--cyber-text)", lineHeight: 1.5 }}>
          {question.question}
        </p>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {(question.options || []).map((opt, idx) => {
          let extraClass = "";
          let iconColor = "var(--cyber-text-muted)";
          
          if (done) {
            if (idx === correctIdx) { extraClass = "correct"; iconColor = "var(--cyber-success)"; }
            else if (idx === selectedIdx && !result.is_correct) { extraClass = "wrong"; iconColor = "var(--cyber-danger)"; }
          } else if (selectedIdx === idx) { extraClass = "selected"; iconColor = "var(--cyber-accent)"; }

          return (
            <button
              key={idx}
              className={`quiz-option ${extraClass}`}
              disabled={done}
              onClick={() => onSelect(question.id, idx)}
              style={{
                width: "100%", textAlign: "left",
                borderRadius: 4, padding: "12px 16px", cursor: done ? "default" : "pointer",
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

        {done && (
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
      if (!window.confirm("WARNING: INCOMPLETE DATASET. PROCEED ANYWAY?")) return;
    }
    
    setSubmitting(true);
    try {
      const res = await submitTamLy(mssv, answers);
      setResults(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      alert("ERR: " + (e.response?.data?.detail || e.message));
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
      alert("ERR: " + (e.response?.data?.detail || e.message));
    } finally {
      setRepredicting(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <div className="spinner" style={{ borderColor: 'var(--cyber-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!hasStarted) return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 0" }}>
      <style>{customStyles}</style>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: "var(--cyber-accent)", textShadow: "var(--cyber-accent-glow)", marginBottom: 8 }}>PSYCH_EVALUATION_PROTOCOL</h1>
        <p style={{ color: "var(--cyber-text-muted)", fontSize: 14, fontFamily: 'var(--font-mono)' }}>
          System to analyze and calibrate time management and psychological stability parameters.
        </p>
      </div>
      <div className="cyber-card" style={{ padding: "56px 32px", textAlign: "center", border: "1px solid var(--cyber-accent)", boxShadow: "inset 0 0 50px rgba(0, 240, 255, 0.05)" }}>
        <div style={{ fontSize: 64, marginBottom: 20, textShadow: "var(--cyber-accent-glow)" }}>🧠</div>
        <h2 style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: "var(--cyber-text)", marginBottom: 16 }}>INITIATE_DIAGNOSTICS</h2>
        <p style={{ color: "var(--cyber-text-muted)", marginBottom: 36, fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: "0 auto 36px", fontFamily: 'var(--font-mono)' }}>
          The core will retrieve 30 random scenarios from the data banks to evaluate your study vectors and mental state.
        </p>
        <button 
          onClick={startTest}
          className="cyber-btn cyber-btn-primary"
          style={{ padding: "18px 48px", fontSize: 16 }}
        >
          EXECUTE_PROTOCOL
        </button>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 0" }}>
      <style>{customStyles}</style>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: "var(--cyber-accent)", textShadow: "var(--cyber-accent-glow)" }}>PSYCH_EVALUATION_PROTOCOL</h1>
      </div>
      <div className="cyber-card" style={{ border: "1px solid var(--cyber-success)", background: "rgba(0, 255, 157, 0.05)", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✓</div>
        <h2 style={{ color: "var(--cyber-success)", fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>NO_EVALUATIONS_REQUIRED</h2>
        <p style={{ color: "var(--cyber-text-muted)", fontSize: 14, fontFamily: 'var(--font-mono)' }}>Database empty or psychological parameters are already optimal.</p>
      </div>
    </div>
  );

  const NUMERIC_FIELDS = [
    { key: "thoi_gian_tu_hoc", label: "STUDY_HOURS", min: 0, max: 40 },
    { key: "chuyen_can", label: "ATTENDANCE_PCT", min: 0, max: 100 },
    { key: "diem_qua_trinh", label: "MIDTERM_SCORE", min: 0, max: 10 },
    { key: "hoan_thanh_bai_tap", label: "TASK_COMPLETION", min: 0, max: 100 },
    { key: "tre_hoc", label: "LATE_COUNT", min: 0, max: 30 }
  ];
  const YESNO_FIELDS = [
    { key: "loai_mon_hoc", label: "SUBJECT_TYPE", options: ["Đại cương", "Chuyên ngành", "Thực hành", "Tự chọn"] },
    { key: "tai_lieu_on_tap", label: "MATERIAL_ACCESS", options: ["Có", "Không"] },
    { key: "hinh_thuc_thi", label: "EXAM_FORMAT", options: ["Tự luận", "Trắc nghiệm", "Thực hành", "Vấn đáp"] },
    { key: "tre_hoc_phi", label: "TUITION_DELAY", options: ["Có", "Không"] },
    { key: "ho_tro", label: "FINANCIAL_AID", options: ["Có", "Không"] },
    { key: "hoc_nhom", label: "GROUP_STUDY", options: ["Có", "Không"] },
    { key: "lam_them", label: "PART_TIME_JOB", options: ["Có", "Không"] },
    { key: "co_kinh_nghiem", label: "PRIOR_EXPERIENCE", options: ["Có", "Không"] }
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 64, paddingTop: 16 }}>
      <style>{customStyles}</style>
      <div style={{ marginBottom: 36, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: "var(--cyber-accent)", textShadow: "var(--cyber-accent-glow)", marginBottom: 12 }}>PSYCH_EVALUATION_PROTOCOL</h1>
        <p style={{ color: "var(--cyber-text-muted)", fontSize: 13, fontFamily: 'var(--font-mono)', maxWidth: 500, margin: "0 auto" }}>
          Analyze and calibrate psychological parameters.
        </p>
      </div>

      {results && (
        <div className="cyber-card" style={{
          background: results.score_percent >= 80 ? "rgba(0, 255, 157, 0.05)" : "rgba(255, 183, 3, 0.05)",
          border: `1px solid ${results.score_percent >= 80 ? "var(--cyber-success)" : "var(--cyber-warning)"}`,
          padding: "32px", marginBottom: 24, textAlign: "center",
          boxShadow: results.score_percent >= 80 ? "inset 0 0 30px rgba(0, 255, 157, 0.1)" : "inset 0 0 30px rgba(255, 183, 3, 0.1)"
        }}>
          <div style={{ fontSize: 48, fontFamily: 'var(--font-display)', color: results.score_percent >= 80 ? "var(--cyber-success)" : "var(--cyber-warning)", marginBottom: 8, textShadow: results.score_percent >= 80 ? "var(--cyber-success-glow)" : "none" }}>{results.score_percent}%</div>
          <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: "var(--cyber-text)" }}>
            {results.score_percent >= 80 ? "STATUS: OPTIMAL // Mental parameters are stable." : "STATUS: SUB_OPTIMAL // Review logs to recalibrate."}
          </div>
          {results.score_percent >= 80 && (
            <div style={{ marginTop: 24, padding: "20px", background: "rgba(0,0,0,0.3)", borderRadius: 4, borderLeft: "3px solid var(--cyber-accent)" }}>
              <p style={{ margin: "0 0 16px", fontSize: 13, fontFamily: 'var(--font-mono)', color: "var(--cyber-text-muted)" }}>
                LOG: Stability detected. Hypothesis: Risk stems from data voids, not mental anomalies. Recommend shifting to AI_TRAINING module to patch knowledge gaps, then run REPREDICT.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button 
                  onClick={() => setShowRepredict(!showRepredict)}
                  className="cyber-btn"
                  style={{ borderColor: "var(--cyber-success)", color: "var(--cyber-success)" }}
                >
                  {showRepredict ? "HIDE_MODULE" : "INITIALIZE_REPREDICT"}
                </button>
                <button 
                  onClick={() => navigate("/sinhvien/bai-tap-ai")}
                  className="cyber-btn cyber-btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <MdAutoAwesome /> AI_TRAINING_MODULE
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showRepredict && results?.score_percent >= 80 && (
        <div className="cyber-card" style={{ marginBottom: 36, border: "1px solid var(--cyber-success)", padding: 36, boxShadow: "inset 0 0 20px rgba(0, 255, 157, 0.1)" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontFamily: 'var(--font-display)', color: "var(--cyber-success)", display: "flex", alignItems: "center", gap: 10 }}>
            <MdTrendingUp size={24} /> METRICS_OVERRIDE_MODULE
          </h3>
          <p style={{ color: "var(--cyber-text-muted)", fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 24 }}>System stability verified. Submit updated parameters to Core Database to reduce active risk vectors.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {NUMERIC_FIELDS.map(f => (
              <div key={f.key}>
                <label className="tech-label" style={{ display: "block", marginBottom: 8 }}>{f.label}</label>
                <input
                  type="number" min={f.min} max={f.max} step={f.key === "diem_qua_trinh" ? 0.1 : 1}
                  value={repredForm[f.key]}
                  onChange={e => setRepredForm(p => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))}
                  className="cyber-input"
                />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {YESNO_FIELDS.map(f => (
              <div key={f.key}>
                <label className="tech-label" style={{ display: "block", marginBottom: 8 }}>{f.label}</label>
                <select
                  value={repredForm[f.key]}
                  onChange={e => setRepredForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="cyber-input"
                >
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={handleRepredict}
            disabled={repredicting}
            className="cyber-btn"
            style={{ background: "rgba(0, 255, 157, 0.1)", borderColor: "var(--cyber-success)", color: "var(--cyber-success)", padding: "14px 32px", display: "flex", alignItems: "center", gap: 10 }}
          >
            {repredicting ? <div className="spinner" style={{ width: 18, height: 18, borderColor: 'var(--cyber-success)', borderTopColor: 'transparent' }} /> : <MdSend />} TRANSMIT_DATA
          </button>

          {repredResult && (
            <div style={{ marginTop: 24, padding: 24, background: "rgba(0, 0, 0, 0.3)", borderRadius: 4, borderLeft: "3px solid var(--cyber-accent)" }}>
              <h4 style={{ margin: "0 0 16px", fontFamily: 'var(--font-display)', color: "var(--cyber-text)" }}>📊 NEW_PROJECTION_RESULT</h4>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <div style={{ textAlign: "center", background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "16px 32px", border: "1px solid var(--cyber-border)" }}>
                  <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', color: repredResult.risk_score >= 0.65 ? "var(--cyber-danger)" : repredResult.risk_score >= 0.4 ? "var(--cyber-warning)" : "var(--cyber-success)" }}>
                    {repredResult.risk_score_percent}%
                  </div>
                  <div className="tech-label">NEW_RISK_VECTOR</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: "var(--cyber-text)", marginBottom: 6 }}>
                    LEVEL: <span style={{ color: repredResult.risk_level === "CAO" ? "var(--cyber-danger)" : "var(--cyber-warning)" }}>{repredResult.risk_level}</span>
                  </div>
                  {repredResult.warning_reasons?.length > 0 ? (
                    <div>
                      {repredResult.warning_reasons.map((r, i) => (
                        <span key={i} className="cyber-badge cyber-badge-warning" style={{ marginRight: 6, marginBottom: 4 }}>{r}</span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "var(--cyber-success)", fontFamily: 'var(--font-mono)', fontSize: 12 }}>SYSTEM: ALL_CLEAR</div>
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
        <div className="cyber-card" style={{ marginTop: 32, padding: 32, textAlign: "center" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontFamily: 'var(--font-display)', color: "var(--cyber-text)" }}>ALL_SCENARIOS_EVALUATED?</h3>
          <p style={{ color: "var(--cyber-text-muted)", marginBottom: 24, fontSize: 13, fontFamily: 'var(--font-mono)' }}>Submit parameters for core analysis.</p>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="cyber-btn cyber-btn-primary"
            style={{ padding: "16px 48px", display: "inline-flex", alignItems: "center", gap: 10 }}
          >
            {submitting ? <div className="spinner" style={{ width: 20, height: 20, borderColor: 'var(--cyber-bg)', borderTopColor: 'transparent' }}/> : <MdCheckCircle size={20} />}
            SUBMIT_EVALUATION
          </button>
        </div>
      )}
    </div>
  );
}
