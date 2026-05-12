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
  if (blocks.length === 1) return <div style={{ lineHeight: 1.6, color: '#475569' }}>{blocks[0]}</div>;

  const borderColor = type === 'warning' ? '#fde68a' : type === 'primary' ? '#bfdbfe' : '#bbf7d0';
  const leftColor = type === 'warning' ? '#f59e0b' : type === 'primary' ? '#3b82f6' : '#10b981';
  const bgColor = type === 'warning' ? '#fffbeb' : type === 'primary' ? '#eff6ff' : '#f0fdf4';

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 16 }}>
      {blocks.map((b, i) => (
        <div key={i} style={{
          background: bgColor, 
          border: `1px solid ${borderColor}`,
          borderLeft: `4px solid ${leftColor}`,
          padding: 16,
          borderRadius: 8,
          fontSize: 14,
          color: "#334155",
          lineHeight: 1.6,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: 4, right: 8, fontSize: 11, fontWeight: 700, color: leftColor, opacity: 0.7 }}>
            Bước {i+1}
          </div>
          <div style={{ marginTop: 8 }}>{b}</div>
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

        try {
          const savedRes = await getSavedAIRoadmap(mssv);
          if (savedRes.data) {
            setMonHoc(savedRes.data.mon_hoc || "");
            setLyDo(savedRes.data.ly_do_rot || "");
            setRoadmapData(savedRes.data);
            return;
          }
        } catch (e) {
          console.log("Không có lộ trình cũ", e);
        }

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

  if (dataLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 60 }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .roadmap-container { position: relative; padding-left: 32px; margin-top: 32px; }
        .roadmap-container::before {
          content: ""; position: absolute; left: 15px; top: 0; bottom: 0;
          width: 2px; background: #e2e8f0;
        }
        .roadmap-node {
          position: relative; margin-bottom: 32px;
          animation: fadeIn 0.6s ease both;
          background: #fff; padding: 24px; border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }
        .roadmap-node::before {
          content: ""; position: absolute; left: -26px; top: 24px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; border: 3px solid #cbd5e1;
          z-index: 1;
        }
        .node-title { font-size: 18px; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .node-content { font-size: 15px; color: #475569; }
        
        .node-0::before { border-color: #f59e0b; }
        .node-1::before { border-color: #3b82f6; }
        .node-2::before { border-color: #10b981; }
        
        .node-0 { border-top: 4px solid #f59e0b; }
        .node-1 { border-top: 4px solid #3b82f6; }
        .node-2 { border-top: 4px solid #10b981; }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>Lộ trình học tập AI</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Đề xuất giải pháp cá nhân hóa giúp cải thiện điểm số và vượt qua môn học.</p>
      </div>

      {!roadmapData && (
        <div className="uni-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8, color: "#1e293b" }}>
            <MdAutoAwesome size={24} color="#2563eb" />
            Tạo lộ trình học tập mới
          </h2>
          
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#475569" }}>Mã số sinh viên</label>
                <input type="text" value={mssv} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#64748b' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#475569" }}>Chuyên ngành</label>
                <input type="text" value={nganh} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#64748b' }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#475569" }}>Môn học cần cải thiện <span style={{color: '#dc2626'}}>*</span></label>
              <input 
                type="text" 
                value={monHoc} 
                onChange={(e) => setMonHoc(e.target.value)}
                placeholder="Ví dụ: Cơ sở dữ liệu nâng cao..." 
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#475569" }}>Khó khăn bạn đang gặp phải <span style={{color: '#dc2626'}}>*</span></label>
              <textarea 
                value={lyDo} 
                onChange={(e) => setLyDo(e.target.value)} 
                placeholder="Bạn hãy miêu tả cụ thể vì sao mình học chưa tốt môn này (Ví dụ: Thiếu tài liệu, mất căn bản, không hiểu thầy cô giảng...)" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', resize: 'vertical' }}
                rows={4}
                required
              />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#dc2626", padding: "12px 16px", borderRadius: 8, border: "1px solid #fca5a5", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <MdErrorOutline size={20} />
                Lỗi: {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="uni-btn"
              style={{
                width: "100%", padding: "16px",
                fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderColor: "#fff", borderTopColor: "transparent" }} /> Đang phân tích lộ trình...</>
              ) : (
                <><MdAutoAwesome size={24} /> Tạo lộ trình</>
              )}
            </button>
          </form>
        </div>
      )}

      {roadmapData && (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
          <div className="uni-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", marginBottom: 24, background: "#f8fafc" }}>
            <div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Môn học cần cải thiện</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginTop: 4 }}>{monHoc}</div>
            </div>
            <button 
              onClick={handleReset}
              className="uni-btn-outline"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, padding: "8px 16px" }}
            >
              <MdRefresh size={18} /> Tạo lộ trình mới
            </button>
          </div>

          <div className="roadmap-container">
            {/* Node 0: Lời khuyên */}
            <div className="roadmap-node node-0" style={{ animationDelay: "0.1s" }}>
              <div className="node-title" style={{ color: "#d97706" }}>
                <MdAutoAwesome size={24} /> Lời khuyên từ chuyên gia AI
              </div>
              <div className="node-content" style={{ lineHeight: 1.6 }}>
                {roadmapData.loi_khuyen}
              </div>
            </div>

            {/* Node 1: Tuần 1 */}
            <div className="roadmap-node node-1" style={{ animationDelay: "0.2s" }}>
              <div className="node-title" style={{ color: "#2563eb" }}>
                <MdSchool size={24} /> Kế hoạch Tuần 1
              </div>
              <div className="node-content">
                <MindMapBoxes text={roadmapData.tuan_1} type="primary" />
              </div>
            </div>

            {/* Node 2: Tuần 2 */}
            <div className="roadmap-node node-2" style={{ animationDelay: "0.3s" }}>
              <div className="node-title" style={{ color: "#16a34a" }}>
                <MdSchool size={24} /> Kế hoạch Tuần 2
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
