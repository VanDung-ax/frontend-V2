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

const MindMapBoxes = ({ text, color }) => {
  const blocks = parseToBlocks(text);
  if (blocks.length === 0) return null;
  if (blocks.length === 1) return <div style={{ lineHeight: 1.6 }}>{blocks[0]}</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 16 }}>
      {blocks.map((b, i) => (
        <div key={i} style={{
          background: `${color}0A`, 
          border: `1px solid ${color}33`,
          borderLeft: `4px solid ${color}`,
          borderRadius: 12, 
          padding: 16,
          fontSize: 14,
          color: "#334155",
          lineHeight: 1.5,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
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
          // Lấy chính xác tên môn học thực tế từ dữ liệu dự báo. Nếu chưa upload file mới, sẽ hiện chữ vui lòng upload
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
          width: 4px; background: linear-gradient(to bottom, #6366f1, #c084fc);
          border-radius: 4px;
        }
        .roadmap-node {
          position: relative; margin-bottom: 40px;
          animation: fadeIn 0.6s ease both;
          background: #fff; padding: 24px; border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .roadmap-node::before {
          content: ""; position: absolute; left: -34px; top: 24px;
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; border: 4px solid #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
          z-index: 1;
        }
        .node-title { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 12px; display: flex; alignItems: center; gap: 8px; }
        .node-content { font-size: 15px; color: #475569; }
        
        .node-0::before { border-color: #f59e0b; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2); }
        .node-1::before { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
        .node-2::before { border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2); }
      `}</style>

      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e293b" }}>Lộ trình học tập AI</h1>
        <p style={{ color: "#64748b", marginTop: 8, fontSize: 15 }}>
          Cá nhân hóa lộ trình dựa trên môn học và lý do rớt của bạn.
        </p>
      </div>

      {!roadmapData && (
        <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 4px 12px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <MdAutoAwesome color="#6366f1" size={24} />
            Khởi tạo lộ trình mới
          </h2>
          
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#334155" }}>MSSV</label>
                <input type="text" value={mssv} disabled className="form-control" style={{ background: "#f8fafc" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#334155" }}>Ngành học</label>
                <input type="text" value={nganh} disabled className="form-control" style={{ background: "#f8fafc" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#334155" }}>Môn học cần cải thiện *</label>
              <input 
                type="text" 
                value={monHoc || "Chưa có dữ liệu môn học. Xin vui lòng upload lại file CSV"} 
                disabled 
                className="form-control"
                style={{ background: "#f8fafc", color: monHoc ? "#334155" : "#ef4444" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#334155" }}>Lý do khó khăn / rớt môn *</label>
              <textarea 
                value={lyDo} 
                onChange={(e) => setLyDo(e.target.value)} 
                placeholder="VD: Thiếu tài liệu ôn tập, chưa hiểu rõ OOP, vắng học nhiều..." 
                className="form-control"
                rows={3}
                required
              />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "12px 16px", borderRadius: 8, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <MdErrorOutline size={20} />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", border: "none", borderRadius: 10, padding: "14px 24px",
                fontSize: 16, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                opacity: loading ? 0.7 : 1, transition: "all 0.2s"
              }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderColor: "#fff", borderTopColor: "transparent" }} /> Đang phân tích...</>
              ) : (
                <><MdAutoAwesome size={20} /> Tạo lộ trình học tập</>
              )}
            </button>
          </form>
        </div>
      )}

      {roadmapData && (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "16px 24px", borderRadius: 16, border: "1px solid #e2e8f0", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Môn học mục tiêu</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{monHoc}</div>
            </div>
            <button 
              onClick={handleReset}
              style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <MdRefresh size={18} /> Làm mới
            </button>
          </div>

          <div className="roadmap-container">
            {/* Node 0: Lời khuyên */}
            <div className="roadmap-node node-0" style={{ animationDelay: "0.1s" }}>
              <div className="node-title" style={{ color: "#d97706" }}>
                <MdAutoAwesome size={24} /> Lời khuyên tổng quan
              </div>
              <div className="node-content" style={{ lineHeight: 1.6 }}>
                {roadmapData.loi_khuyen}
              </div>
            </div>

            {/* Node 1: Tuần 1 */}
            <div className="roadmap-node node-1" style={{ animationDelay: "0.2s" }}>
              <div className="node-title" style={{ color: "#2563eb" }}>
                <MdSchool size={24} /> Mục tiêu Tuần 1
              </div>
              <div className="node-content">
                <MindMapBoxes text={roadmapData.tuan_1} color="#2563eb" />
              </div>
            </div>

            {/* Node 2: Tuần 2 */}
            <div className="roadmap-node node-2" style={{ animationDelay: "0.3s" }}>
              <div className="node-title" style={{ color: "#059669" }}>
                <MdSchool size={24} /> Mục tiêu Tuần 2
              </div>
              <div className="node-content">
                <MindMapBoxes text={roadmapData.tuan_2} color="#059669" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
