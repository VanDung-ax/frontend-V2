import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getTamLyRandom, submitTamLy } from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  MdCheckCircle, MdCancel, MdQuiz, MdRefresh,
  MdSend, MdTrendingDown, MdTrendingUp, MdAutoAwesome, MdErrorOutline
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

// Xóa ký hiệu "biến thể" và "#..." khỏi text câu hỏi trước khi hiển thị
const cleanQuestion = (text) => {
  if (!text) return "";
  return text
    .replace(/\s*#\s*biến\s*thể\s*\d*/gi, "")        // # biến thể 2, #biến thể
    .replace(/\s*\(\s*biến\s*thể\s*\d*\s*\)/gi, "")  // (biến thể 2)
    .replace(/\s*biến\s*thể\s*#?\s*\d+/gi, "")        // biến thể 2, biến thể #3
    .replace(/\s*#\d+/g, "")                           // #2, #3
    .replace(/\s*#[^\n]*/g, "")                        // # ... bất kỳ
    .replace(/\s*\(\s*\d*\s*\)/g, "")                 // () hoặc (2) còn sót
    .trim();
};

function QuizCard({ question, index, selectedIdx, onSelect, result }) {
  const done = result !== undefined;
  const correctIdx = done ? result.correct_index : null;

  return (
    <div className="uni-card" style={{ padding: 0, marginBottom: 24, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Câu {index + 1} — Nhóm: {question.thuoc_tinh}
        </div>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b", lineHeight: 1.6 }}>
          {cleanQuestion(question.question)}
        </p>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {(question.options || []).map((opt, idx) => {
          let extraClass = "";
          let iconColor = "#94a3b8";
          
          if (done) {
            if (idx === correctIdx) { extraClass = "correct"; iconColor = "#10b981"; }
            else if (idx === selectedIdx && !result.is_correct) { extraClass = "wrong"; iconColor = "#ef4444"; }
          } else if (selectedIdx === idx) { extraClass = "selected"; iconColor = "#3b82f6"; }

          return (
            <button
              key={idx}
              className={`quiz-option ${extraClass}`}
              disabled={done}
              onClick={() => onSelect(question.id, idx)}
              style={{
                width: "100%", textAlign: "left",
                borderRadius: 8, padding: "14px 16px", cursor: done ? "default" : "pointer",
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

        {done && (
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
                {result.is_correct ? "Đáp án chính xác" : "Đáp án chưa chính xác // Lời khuyên:"}
              </div>
              <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
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
      alert("Lỗi: " + (e.response?.data?.detail || e.message));
    } finally {
      setSubmitting(false);
    }
  };



  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  if (!hasStarted) return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 0" }}>
      <style>{customStyles}</style>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 12px 0' }}>Bài kiểm tra Tâm lý & Thói quen học tập</h1>
        <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
          Hệ thống sẽ đánh giá các chỉ số tâm lý, kỹ năng quản lý thời gian và thái độ học tập của bạn.
        </p>
      </div>
      <div className="uni-card" style={{ padding: "48px 32px", textAlign: "center", border: "1px solid #bfdbfe", background: "#f8fafc" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🧠</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Sẵn sàng làm bài kiểm tra</h2>
        <p style={{ color: "#475569", marginBottom: 36, fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: "0 auto 36px" }}>
          Hệ thống sẽ cung cấp 20 câu hỏi ngẫu nhiên được lựa chọn từ ngân hàng dữ liệu để phân tích chuyên sâu về trạng thái tâm lý và hành vi học tập của bạn.
        </p>
        <button 
          onClick={startTest}
          className="uni-btn"
          style={{ padding: "16px 48px", fontSize: 16, display: "inline-flex", gap: 10, alignItems: "center" }}
        >
          <MdQuiz size={24} /> Bắt đầu làm bài
        </button>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 0" }}>
      <style>{customStyles}</style>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b' }}>Bài kiểm tra Tâm lý & Thói quen học tập</h1>
      </div>
      <div className="uni-card" style={{ border: "1px solid #bbf7d0", background: "#f0fdf4", padding: "48px 24px", textAlign: "center" }}>
        <MdCheckCircle size={64} color="#16a34a" style={{ marginBottom: 16 }} />
        <h2 style={{ color: "#16a34a", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Chưa có bài kiểm tra nào</h2>
        <p style={{ color: "#475569", fontSize: 15 }}>Dữ liệu câu hỏi đang trống hoặc bạn đã hoàn thành tất cả các bài đánh giá.</p>
      </div>
    </div>
  );



  return (
    <div style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 64, paddingTop: 16 }}>
      <style>{customStyles}</style>
      <div style={{ marginBottom: 36, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>Bài kiểm tra Tâm lý & Thói quen học tập</h1>
        <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
          Vui lòng trả lời thành thực các câu hỏi dưới đây.
        </p>
      </div>

      {results && (
        <div className="uni-card" style={{
          background: results.score_percent >= 75 ? "#f0fdf4" : "#fffbeb",
          border: `1px solid ${results.score_percent >= 75 ? "#bbf7d0" : "#fde68a"}`,
          padding: "32px", marginBottom: 32, textAlign: "center"
        }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: results.score_percent >= 75 ? "#16a34a" : "#d97706", marginBottom: 8 }}>{results.score_percent}%</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            {results.score_percent >= 75 ? "Tâm lý học tập ổn định" : "Cần điều chỉnh phương pháp học tập"}
          </div>
          <div style={{ fontSize: 15, color: "#475569" }}>
            {results.score_percent >= 75 ? "Bạn có thói quen học tập tốt và tâm lý vững vàng." : "Bạn đang gặp khó khăn trong việc quản lý thời gian và sắp xếp việc học."}
          </div>
          
          {results.score_percent >= 75 && (
            <div style={{ marginTop: 24, padding: "24px", background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 20px", fontSize: 15, color: "#334155", lineHeight: 1.6 }}>
                <strong>Kết luận từ AI:</strong> Do bạn có tâm lý học tập rất ổn định (trên 75%), hệ thống chẩn đoán rủi ro học tập của bạn chủ yếu đến từ việc <strong>hổng kiến thức nền tảng</strong>. Bạn nên chuyển qua phần Bài tập AI để làm thêm bài tập rèn luyện nhằm củng cố kiến thức.
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                <button 
                  onClick={() => navigate("/sinhvien/bai-tap-ai")}
                  className="uni-btn"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <MdAutoAwesome size={20} /> Đi đến Bài tập AI
                </button>
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
        <div className="uni-card" style={{ marginTop: 32, padding: 32, textAlign: "center" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Đã trả lời xong?</h3>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: 15 }}>Hãy chắc chắn bạn đã chọn đáp án cho tất cả câu hỏi trước khi nộp bài.</p>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="uni-btn"
            style={{ padding: "16px 48px", display: "inline-flex", alignItems: "center", gap: 10, fontSize: 16 }}
          >
            {submitting ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderColor: "#fff", borderTopColor: "transparent" }}/> : <MdCheckCircle size={24} />}
            Nộp bài kiểm tra
          </button>
        </div>
      )}
    </div>
  );
}
