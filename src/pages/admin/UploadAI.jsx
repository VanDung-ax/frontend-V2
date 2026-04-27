import { useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { uploadPredict } from "../../services/api";
import {
  MdCloudUpload,
  MdCheckCircle,
  MdError,
  MdInsertDriveFile,
  MdTableChart,
} from "react-icons/md";

export default function UploadAI() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter((l) => l.trim());
      const headers = lines[0]
        .split(",")
        .map((h) => h.replace(/"/g, "").trim());
      const rows = lines.slice(1, 6).map((l) => {
        const vals = l.split(",").map((v) => v.replace(/"/g, "").trim());
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
      });
      setPreview({
        headers: headers.slice(0, 8),
        rows,
        total: lines.length - 1,
      });
    };
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) handleFile(f);
  };

  const [tenDot, setTenDot] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const r = await uploadPredict(file, user?.id, tenDot || undefined);
      setResult({
        type: "success",
        text: r.data?.message || `Phân tích hoàn tất! Batch ID: ${r.data?.batch_id}`,
      });
    } catch (err) {
      setResult({
        type: "danger",
        text: err.response?.data?.detail || "Lỗi khi gửi dữ liệu.",
      });
    }
    setLoading(false);
  };

  return (
    <div
      style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          Upload & AI Phân tích
        </h1>
        <p
          style={{
            color: "#64748b",
            fontSize: "15px",
            maxWidth: "600px",
            lineHeight: "1.5",
          }}
        >
          Tải lên danh sách sinh viên bằng file CSV để hệ thống AI tự động quét,
          phân tích <strong>13 thuộc tính</strong> và dự báo mức độ rủi ro học tập.
        </p>
      </div>

      {/* Grid chia 2 khung cân bằng (1fr 1fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Khung bên trái: Upload Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                Cung cấp dữ liệu sinh viên
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                Hỗ trợ định dạng file <strong>.csv</strong> với các trường dữ
                liệu chuẩn bị sẵn.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#2563eb" : file ? "#3b82f6" : "#cbd5e1"}`,
                borderRadius: "12px",
                padding: "40px 20px",
                textAlign: "center",
                background: dragOver ? "#dbeafe" : file ? "#eff6ff" : "#f8fafc",
                cursor: "pointer",
                transition: "all 0.2s",
                marginBottom: "20px",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                hidden
                onChange={(e) =>
                  e.target.files[0] && handleFile(e.target.files[0])
                }
              />

              {file ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      background: "#dbeafe",
                      color: "#2563eb",
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <MdInsertDriveFile size={28} />
                  </div>
                  <div
                    style={{
                      fontWeight: "700",
                      color: "#1e3a8a",
                      fontSize: "14px",
                    }}
                  >
                    {file.name}
                  </div>
                  <div
                    style={{
                      color: "#3b82f6",
                      fontSize: "12px",
                      marginTop: "4px",
                      fontWeight: "500",
                    }}
                  >
                    Nhấn để đổi file khác
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      color: dragOver ? "#2563eb" : "#94a3b8",
                      marginBottom: "12px",
                      transition: "color 0.2s",
                    }}
                  >
                    <MdCloudUpload size={48} />
                  </div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#475569",
                      fontSize: "14px",
                    }}
                  >
                    {dragOver
                      ? "Thả file vào đây..."
                      : "Kéo thả hoặc nhấn để chọn file"}
                  </div>
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "12px",
                      marginTop: "6px",
                    }}
                  >
                    Dung lượng tối đa 50MB
                  </div>
                </div>
              )}
            </div>

            {/* Tên đợt dự báo */}
            {file && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Tên đợt dự báo (tuỳ chọn)</label>
                <input
                  type="text" value={tenDot}
                  onChange={e => setTenDot(e.target.value)}
                  placeholder="VD: Học kỳ 1 - 2024"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            )}

            {/* Nút hành động */}
            {file && (
              <button
                onClick={handleUpload}
                disabled={loading}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  background: loading ? "#e2e8f0" : "#2563eb",
                  color: loading ? "#94a3b8" : "#fff",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {loading ? (
                  <>
                    <MdCloudUpload
                      size={20}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Đang gửi tới máy chủ AI...
                  </>
                ) : (
                  <>
                    <MdCheckCircle size={20} />
                    Bắt đầu Phân tích & Lưu Dữ liệu
                  </>
                )}
              </button>
            )}

            {/* Cảnh báo kết quả */}
            {result && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "8px",
                  marginTop: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: result.type === "success" ? "#ecfdf5" : "#fef2f2",
                  color: result.type === "success" ? "#065f46" : "#991b1b",
                  border: `1px solid ${result.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                  fontSize: "14px",
                }}
              >
                {result.type === "success" ? (
                  <MdCheckCircle size={20} />
                ) : (
                  <MdError size={20} />
                )}
                <span style={{ fontWeight: "500" }}>{result.text}</span>
              </div>
            )}
          </div>

          {/* Preview Table */}
          {preview && (
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <MdTableChart size={20} color="#475569" />
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Xem trước dữ liệu ({preview.total} sinh viên)
                </h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#fff",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      {preview.headers.map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 20px",
                            fontSize: "12px",
                            color: "#64748b",
                            fontWeight: "700",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: i % 2 === 0 ? "#fff" : "#fafafa",
                        }}
                      >
                        {preview.headers.map((h) => (
                          <td
                            key={h}
                            style={{
                              padding: "10px 20px",
                              fontSize: "13px",
                              color: "#334155",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  padding: "10px 20px",
                  background: "#f8fafc",
                  fontSize: "12px",
                  color: "#64748b",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                Đang hiển thị 5 dòng dữ liệu đầu tiên.
              </div>
            </div>
          )}
        </div>

        {/* Khung bên phải: Info Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* CSV Structure Card */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>📋</span> Cấu trúc CSV bắt buộc
            </div>

            <div
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#64748b",
                marginBottom: "12px",
              }}
            >
              THÔNG TIN CƠ BẢN
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {["MSSV", "HoTen", "Khoa", "Nganh", "Lop"].map((col) => (
                <span
                  key={col}
                  style={{
                    background: "#f1f5f9",
                    color: "#334155",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    fontWeight: "600",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {col}
                </span>
              ))}
            </div>

            <div
              style={{ height: "1px", background: "#e2e8f0", margin: "24px 0" }}
            ></div>

            <div
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#64748b",
                marginBottom: "12px",
              }}
            >
              13 THUỘC TÍNH AI (FEATURES)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {[
                "thoi_gian_tu_hoc",
                "chuyen_can",
                "diem_qua_trinh",
                "hoan_thanh_bai_tap",
                "loai_mon_hoc",
                "tai_lieu_on_tap",
                "hinh_thuc_thi",
                "tre_hoc_phi",
                "ho_tro",
                "tre_hoc",
                "hoc_nhom",
                "lam_them",
                "co_kinh_nghiem",
              ].map((col) => (
                <span
                  key={col}
                  style={{
                    background: "#eff6ff",
                    color: "#2563eb",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    fontWeight: "600",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  {col}
                </span>
              ))}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#64748b",
                marginTop: "20px",
                lineHeight: "1.6",
              }}
            >
              * Lưu ý: Tên cột (Header) trong file CSV phải khớp chính xác từng
              chữ cái và dấu gạch dưới với cấu trúc trên.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
