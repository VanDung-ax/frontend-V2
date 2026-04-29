import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getAIRoadmap, getSavedAIRoadmap, getStudent, getProgress } from "../../services/api";
import { MdRefresh, MdAutoAwesome, MdSchool, MdErrorOutline } from "react-icons/md";

const parseToBlocks = (text) => {
  if (!text) return [];
  const lines = text.split('\n');
  const blocks = [];
  lines.forEach(line => {
    let clean = line.replace(/^[-*•\d.]+\s+/, '').trim();
    if (!clean) return;
    if (clean.length > 80 && clean.includes('. ')) {
      const sentences = clean.split('. ');
      sentences.forEach(s => {
        let sc = s.trim();
        if (!sc) return;
        if (!sc.endsWith('.')) sc += '.';
        if (sc.length > 10) blocks.push(sc);
      });
    } else {
      blocks.push(clean);
    }
  });
  return blocks;
};

const MindMapBoxes = ({ text, type }) => {
  const blocks = parseToBlocks(text);
  if (blocks.length === 0) return null;
  if (blocks.length === 1) return <div style={{ lineHeight: 1.6, color: 'var(--cyber-text)' }}>{blocks[0]}</div>;

  const colorVar = type === 'warning' ? 'var(--cyber-warning)' : type === 'primary' ? 'var(--cyber-accent)' : 'var(--cyber-success)';

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 16 }}>
      {blocks.map((b, i) => (
        <div key={i} style={{
          background: `rgba(0, 0, 0, 0.2)`, 
          border: `1px solid rgba(255,255,255,0.1)`,
          borderLeft: `3px solid ${colorVar}`,
          padding: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: "var(--cyber-text-muted)",
          lineHeight: 1.5,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: 0, right: 0, fontSize: 10, padding: "2px 6px", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
            SEQ_{i+1}
          </div>
          {b}
        </div>
      ))}
    </div>
  );
};

export default function LoTrinhHocTap() {
  const { user } = useAuth();
  const [mssv] = useState(user?.linked_id || "");
  const [nganh, setNganh] = useState("");
  const [monHoc, setMonHoc] = useState("");
  const [lyDo, setLyDo] = useState("");

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [roadmapData, setRoadmapData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      if (!mssv) {
        setDataLoading(false);
        return;
      }
      try {
        const studentRes = await getStudent(mssv);
        
        if (studentRes.data?.Nganh) setNganh(studentRes.data.Nganh);
        else setNganh("Chưa cập nhật ngành");

        // Thử lấy lộ trình đã lưu
        try {
          const savedRes = await getSavedAIRoadmap(mssv);
          if (savedRes.data) {
            setMonHoc(savedRes.data.mon_hoc || "");
            setLyDo(savedRes.data.ly_do_rot || "");
            setRoadmapData(savedRes.data);
            return; // Đã có lộ trình thì dừng
          }
        } catch (e) {
          console.log("Không có lộ trình cũ", e);
        }

        // Nếu chưa có lộ trình, lấy dữ liệu gợi ý từ dự báo
        const progressRes = await getProgress(mssv);
        if (progressRes.data?.history?.length > 0) {
          const latest = progressRes.data.history[progressRes.data.history.length - 1];
          if (latest.ten_mon_hoc) {
             setMonHoc(latest.ten_mon_hoc);
          } else {
             setMonHoc(""); 
          }

          if (latest.warning_reasons && latest.warning_reasons.length > 0) {
            setLyDo(latest.warning_reasons.join(", "));
          }
        }
      } catch (e) {
        console.error("Lỗi khi tải dữ liệu khởi tạo:", e);
      } finally {
        setDataLoading(false);
      }
    }
    loadInitialData();
  }, [mssv]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!monHoc.trim() || !lyDo.trim()) {
      setError("Vui lòng nhập đầy đủ môn học và lý do rớt.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getAIRoadmap(mssv, nganh, monHoc, lyDo);
      if (res.data) setRoadmapData(res.data);
      else setError("Không nhận được dữ liệu từ AI.");
    } catch (err) {
      console.error(err);
      setError("Lỗi khi kết nối đến AI. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRoadmapData(null);
    setMonHoc("");
    setLyDo("");
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 60 }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .roadmap-container { position: relative; padding-left: 40px; margin-top: 40px; }
        .roadmap-container::before {
          content: ""; position: absolute; left: 15px; top: 0; bottom: 0;
          width: 2px; background: rgba(0, 240, 255, 0.3);
          box-shadow: var(--cyber-accent-glow);
        }
        .roadmap-node {
          position: relative; margin-bottom: 40px;
          animation: fadeIn 0.6s ease both;
          background: var(--cyber-card); padding: 24px; border-radius: 4px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          border: 1px solid var(--cyber-border);
        }
        .roadmap-node::before {
          content: ""; position: absolute; left: -34px; top: 24px;
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--cyber-bg); border: 2px solid var(--cyber-accent);
          box-shadow: var(--cyber-accent-glow);
          z-index: 1;
        }
        .node-title { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--cyber-accent); margin-bottom: 12px; display: flex; alignItems: center; gap: 8px; letter-spacing: 1px; }
        .node-content { font-size: 14px; color: var(--cyber-text); font-family: var(--font-mono); }
        
        .node-0::before { border-color: var(--cyber-warning); box-shadow: 0 0 10px rgba(255, 183, 3, 0.5); }
        .node-1::before { border-color: var(--cyber-accent); }
        .node-2::before { border-color: var(--cyber-success); box-shadow: var(--cyber-success-glow); }
        
        .node-0 { border-top: 2px solid var(--cyber-warning); }
        .node-1 { border-top: 2px solid var(--cyber-accent); }
        .node-2 { border-top: 2px solid var(--cyber-success); }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, color: 'var(--cyber-accent)', textShadow: 'var(--cyber-accent-glow)', margin: 0 }}>AI_LEARNING_PATH</h1>
        <p style={{ color: "var(--cyber-text-muted)", fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, margin: "4px 0 0" }}>
          PERSONALIZED_RECOVERY_PROTOCOL
        </p>
      </div>

      {!roadmapData && (
        <div className="cyber-card">
          <h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 20, display: "flex", alignItems: "center", gap: 8, color: "var(--cyber-accent)" }}>
            <MdAutoAwesome size={24} />
            INITIALIZE_NEW_PATH
          </h2>
          
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ flex: 1 }}>
                <label className="tech-label" style={{ display: "block", marginBottom: 8 }}>STUDENT_ID</label>
                <input type="text" value={mssv} disabled className="cyber-input" style={{ opacity: 0.7 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="tech-label" style={{ display: "block", marginBottom: 8 }}>MAJOR</label>
                <input type="text" value={nganh} disabled className="cyber-input" style={{ opacity: 0.7 }} />
              </div>
            </div>

            <div>
              <label className="tech-label" style={{ display: "block", marginBottom: 8 }}>TARGET_SUBJECT *</label>
              <input 
                type="text" 
                value={monHoc || "DATA_MISSING_PLEASE_UPDATE_CORE"} 
                disabled 
                className="cyber-input"
                style={{ opacity: 0.7, color: monHoc ? "var(--cyber-accent)" : "var(--cyber-danger)" }}
              />
            </div>

            <div>
              <label className="tech-label" style={{ display: "block", marginBottom: 8 }}>DIFFICULTY_REASONS *</label>
              <textarea 
                value={lyDo} 
                onChange={(e) => setLyDo(e.target.value)} 
                placeholder="INPUT_FAILURE_METRICS (e.g., LACK_OF_MATERIALS, KNOWLEDGE_GAPS...)" 
                className="cyber-input"
                rows={3}
                required
              />
            </div>

            {error && (
              <div style={{ background: "rgba(255, 0, 85, 0.1)", color: "var(--cyber-danger)", padding: "12px 16px", border: "1px solid var(--cyber-danger)", fontSize: 13, display: "flex", alignItems: "center", gap: 8, fontFamily: 'var(--font-mono)' }}>
                <MdErrorOutline size={20} />
                ERR: {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="cyber-btn cyber-btn-primary"
              style={{
                width: "100%", padding: "16px",
                fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderColor: "var(--cyber-bg)", borderTopColor: "transparent" }} /> COMPUTING_PATH...</>
              ) : (
                <><MdAutoAwesome size={20} /> GENERATE_PROTOCOL</>
              )}
            </button>
          </form>
        </div>
      )}

      {roadmapData && (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
          <div className="cyber-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", marginBottom: 24, background: "rgba(0, 240, 255, 0.05)" }}>
            <div>
              <div className="tech-label">TARGET_SUBJECT</div>
              <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: "var(--cyber-text)", marginTop: 4 }}>{monHoc}</div>
            </div>
            <button 
              onClick={handleReset}
              className="cyber-btn"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}
            >
              <MdRefresh size={16} /> RESET_PROTOCOL
            </button>
          </div>

          <div className="roadmap-container">
            {/* Node 0: Lời khuyên */}
            <div className="roadmap-node node-0" style={{ animationDelay: "0.1s" }}>
              <div className="node-title" style={{ color: "var(--cyber-warning)" }}>
                <MdAutoAwesome size={24} /> NODE_00 // SYSTEM_ADVICE
              </div>
              <div className="node-content" style={{ lineHeight: 1.6, color: "var(--cyber-text-muted)" }}>
                {roadmapData.loi_khuyen}
              </div>
            </div>

            {/* Node 1: Tuần 1 */}
            <div className="roadmap-node node-1" style={{ animationDelay: "0.2s" }}>
              <div className="node-title">
                <MdSchool size={24} /> NODE_01 // PHASE_ONE
              </div>
              <div className="node-content">
                <MindMapBoxes text={roadmapData.tuan_1} type="primary" />
              </div>
            </div>

            {/* Node 2: Tuần 2 */}
            <div className="roadmap-node node-2" style={{ animationDelay: "0.3s" }}>
              <div className="node-title" style={{ color: "var(--cyber-success)" }}>
                <MdSchool size={24} /> NODE_02 // PHASE_TWO
              </div>
              <div className="node-content">
                <MindMapBoxes text={roadmapData.tuan_2} type="success" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
