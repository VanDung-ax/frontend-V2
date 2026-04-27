import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllResults,
  generateAdvice,
  addStudent,
  getKhoaList,
  getAssignData,
} from "../../services/api";
import { MdSearch, MdClose, MdWarning } from "react-icons/md";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
  LineChart,
  Line,
} from "recharts";

function getRiskBadge(score) {
  if (score >= 0.8)
    return <span className="badge badge-danger">NGUY KÍCH</span>;
  if (score >= 0.65)
    return <span className="badge badge-warning">RỦI RO CAO</span>;
  return <span className="badge badge-success">AN TOÀN</span>;
}
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
const BG = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#db2777"];
function colorFor(name) {
  let s = 0;
  for (const c of name || "") s += c.charCodeAt(0);
  return BG[s % BG.length];
}

function formatAdviceText(text) {
  if (!text) return null;
  // Bỏ các dấu gạch đứng |
  const cleanedText = text.replace(/\|/g, "");
  
  return cleanedText.split("\n").map((line, idx) => {
    // Basic bold parsing for **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <div key={idx} style={{ minHeight: "1rem", marginBottom: "4px" }}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </div>
    );
  });
}

export default function QuanLySinhVien() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKhoa, setFilterKhoa] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [selected, setSelected] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    MSSV: "",
    HoTen: "",
    MaKhoa: "",
    Nganh: "",
    Lop: "",
  });
  const [khoas, setKhoas] = useState([]);
  const [lops, setLops] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [formError, setFormError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getNganhOptionsForKhoa = (maKhoa) => [
    ...new Set(
      students.filter((s) => s.Khoa === maKhoa && s.Nganh).map((s) => s.Nganh),
    ),
  ];

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await getAllResults(user?.id, "all");
      const raw = res.data || [];
      const map = {};
      raw.forEach((r) => {
        if (
          !map[r.MSSV] ||
          new Date(r.created_at) > new Date(map[r.MSSV].created_at)
        )
          map[r.MSSV] = r;
      });
      setStudents(Object.values(map));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, [user]);

  const loadLops = async (maKhoa) => {
    if (!maKhoa) {
      setLops([]);
      setForm((prev) => ({ ...prev, MaKhoa: "", Lop: "", Nganh: "" }));
      return;
    }
    try {
      const res = await getAssignData(maKhoa);
      const nextLops = res.data?.lops || [];
      const nextNganhs = getNganhOptionsForKhoa(maKhoa);
      setLops(nextLops);
      setForm((prev) => ({
        ...prev,
        MaKhoa: maKhoa,
        Lop: nextLops[0]?.MaLop || "",
        Nganh: prev.Nganh || nextNganhs[0] || "",
      }));
    } catch {
      setLops([]);
      setForm((prev) => ({ ...prev, MaKhoa: maKhoa, Lop: "", Nganh: "" }));
    }
  };

  useEffect(() => {
    async function loadKhoas() {
      try {
        const res = await getKhoaList();
        const nextKhoas = res.data || [];
        setKhoas(nextKhoas);
        if (nextKhoas.length > 0 && !form.MaKhoa) {
          await loadLops(nextKhoas[0].MaKhoa);
        }
      } catch {}
    }
    loadKhoas();
  }, []);

  const handleOpenModal = async () => {
    const initialKhoa = khoas[0]?.MaKhoa || "";
    setForm({
      MSSV: "",
      HoTen: "",
      MaKhoa: initialKhoa,
      Nganh: "",
      Lop: "",
    });
    setFormError(null);
    setMsg(null);
    setShowModal(true);
    await loadLops(initialKhoa);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      MSSV: form.MSSV.trim(),
      HoTen: form.HoTen.trim(),
      MaKhoa: form.MaKhoa.trim(),
      Nganh: form.Nganh.trim(),
      Lop: form.Lop.trim(),
      username: form.MSSV.trim(),
      password: form.MSSV.trim(),
    };
    if (
      !payload.MSSV ||
      !payload.HoTen ||
      !payload.MaKhoa ||
      !payload.Nganh ||
      !payload.Lop
    ) {
      setFormError("Vui lòng nhập đầy đủ MSSV, Họ và Tên, Khoa, Ngành và Lớp.");
      return;
    }
    setSaving(true);
    try {
      await addStudent(payload);
      setMsg({ type: "success", text: "Thêm sinh viên thành công!" });
      setShowModal(false);
      await loadStudents();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setFormError(detail || "Lỗi khi thêm sinh viên.");
    }
    setSaving(false);
  };

  const studentKhoas = [
    ...new Set(students.map((s) => s.Khoa).filter(Boolean)),
  ];

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.MSSV?.includes(search) ||
      s.HoTen?.toLowerCase().includes(search.toLowerCase());
    const matchKhoa = filterKhoa === "all" || s.Khoa === filterKhoa;
    const score = s.risk_score || 0;
    const matchRisk =
      filterRisk === "all" ||
      (filterRisk === "high" && score >= 0.65) ||
      (filterRisk === "medium" && score >= 0.4 && score < 0.65) ||
      (filterRisk === "low" && score < 0.4);
    return matchSearch && matchKhoa && matchRisk;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pagedStudents = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalStudents = students.length;
  const atRiskCount = students.filter(
    (s) => (s.risk_score || 0) >= 0.65,
  ).length;
  const avgRiskScore = totalStudents
    ? (students.reduce((sum, s) => sum + (s.risk_score || 0), 0) /
        totalStudents) *
      100
    : 0;
  const highRiskPercentage = totalStudents
    ? (atRiskCount / totalStudents) * 100
    : 0;
  const atRiskByKhoa = students
    .filter((s) => (s.risk_score || 0) >= 0.65)
    .reduce((acc, s) => {
      const key = s.Khoa || "Không xác định";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const maxAtRiskCount = Math.max(...Object.values(atRiskByKhoa), 1);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleGetAdvice = async () => {
    if (!selected) return;
    setAdviceLoading(true);
    try {
      const reasons = selected.reasons || [];
      const r = await generateAdvice(selected.MSSV, reasons);
      const newAdvice = r.data?.advice || "Không có lời khuyên.";
      setAdvice(newAdvice);
      
      // Tự động load lại danh sách sinh viên để cập nhật lời khuyên vào 'selected.advices'
      await loadStudents();
      
    } catch {
      setAdvice("Lỗi kết nối AI.");
    }
    setAdviceLoading(false);
  };

  const detailRows = selected
    ? [
        { label: "Chuyên cần", value: `${selected.chuyen_can || 0}` },
        { label: "Thời gian tự học", value: `${selected.thoi_gian_tu_hoc || 0}h` },
        { label: "Điểm quá trình", value: selected.diem_qua_trinh || 0 },
        { label: "Hoàn thành BT", value: `${selected.hoan_thanh_bai_tap || 0}%` },
        { label: "Trễ học", value: `${selected.tre_hoc || 0} buổi` },
        { label: "Loại môn học", value: selected.loai_mon_hoc || "N/A" },
        { label: "Tài liệu", value: selected.tai_lieu_on_tap || "N/A" },
        { label: "Hình thức thi", value: selected.hinh_thuc_thi || "N/A" },
        { label: "Trễ học phí", value: selected.tre_hoc_phi || "N/A" },
        { label: "Hỗ trợ", value: selected.ho_tro || "N/A" },
        { label: "Học nhóm", value: selected.hoc_nhom || "N/A" },
        { label: "Làm thêm", value: selected.lam_them || "N/A" },
        { label: "Có kinh nghiệm", value: selected.co_kinh_nghiem || "N/A" },
      ]
    : [];

  const riskLevelLabels = [
    "THẤP (An toàn)",
    "TRUNG BÌNH (Cảnh báo)",
    "CAO (Nguy hiểm)",
  ];

  const riskLevelLabel = (score) => {
    if (score >= 0.65) return "CAO (Nguy hiểm)";
    if (score >= 0.4) return "TRUNG BÌNH (Cảnh báo)";
    return "THẤP (An toàn)";
  };

  const avgByRiskLevel = (field) => {
    const aggregate = filtered.reduce((acc, item) => {
      const label = riskLevelLabel(Number(item.risk_score) || 0);
      const value = Number(item[field]);
      if (!Number.isNaN(value)) {
        if (!acc[label]) acc[label] = { total: 0, count: 0 };
        acc[label].total += value;
        acc[label].count += 1;
      }
      return acc;
    }, {});

    return riskLevelLabels.map((label) => ({
      name: label,
      value: aggregate[label]?.count
        ? Number((aggregate[label].total / aggregate[label].count).toFixed(1))
        : 0,
    }));
  };

  const countBy = (field, data = filtered) => {
    const result = Object.entries(
      data.reduce((acc, item) => {
        const value = item[field] ?? "Chưa xác định";
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));

    // Bảng quy định thứ tự chuẩn cho các biểu đồ
    const orderMap = {
      Low: 1,
      Medium: 2,
      High: 3,

      // Khai báo sẵn thêm cho các biểu đồ khác để chúng cũng xếp đẹp luôn
      Negative: 1,
      Neutral: 2,
      Positive: 3,
      Far: 1,
      Moderate: 2,
      Near: 3,
      No: 1,
      Yes: 2,
      "Chưa xác định": 99,
    };

    // Thực hiện ép sắp xếp theo thứ tự orderMap
    return result.sort((a, b) => {
      const valA = orderMap[a.name];
      const valB = orderMap[b.name];

      // Nếu cả 2 nhãn đều nằm trong danh sách khai báo, xếp theo thứ tự 1, 2, 3
      if (valA !== undefined && valB !== undefined) return valA - valB;
      // Nếu chỉ có 1 nhãn có, ưu tiên nhãn đó lên trước
      if (valA !== undefined) return -1;
      if (valB !== undefined) return 1;

      // Mặc định thì xếp theo chữ cái A-Z
      return a.name.localeCompare(b.name);
    });
  };

  const riskScoreBuckets = () => {
    const buckets = {
      "An toàn <40%": 0,
      "Trung bình 40-65%": 0,
      "Nguy cơ >=65%": 0,
    };

    filtered.forEach((item) => {
      const score = Number(item.risk_score) || 0;
      if (score >= 0.65) buckets["Nguy cơ >=65%"] += 1;
      else if (score >= 0.4) buckets["Trung bình 40-65%"] += 1;
      else buckets["An toàn <40%"] += 1;
    });

    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  };

  const riskScoreData = riskScoreBuckets();
  const riskScoreColors = ["#22c55e", "#f59e0b", "#ef4444"];

  const chartCards = [
    { title: "Chuyên cần", data: avgByRiskLevel("chuyen_can"), colorIndex: 1 },
    { title: "Giờ tự học", data: avgByRiskLevel("thoi_gian_tu_hoc"), colorIndex: 2 },
    { title: "Điểm quá trình", data: avgByRiskLevel("diem_qua_trinh"), colorIndex: 3 },
    { title: "Hoàn thành BT (%)", data: avgByRiskLevel("hoan_thanh_bai_tap"), colorIndex: 4 },
    { title: "Trễ học (buổi)", data: avgByRiskLevel("tre_hoc"), colorIndex: 5 },
    { title: "Tài liệu ôn tập", data: countBy("tai_lieu_on_tap"), colorIndex: 0 },
    { title: "Loại môn học", data: countBy("loai_mon_hoc"), colorIndex: 1 },
    { title: "Hình thức thi", data: countBy("hinh_thuc_thi"), colorIndex: 2 },
    { title: "Trễ học phí", data: countBy("tre_hoc_phi"), colorIndex: 3 },
    { title: "Hỗ trợ", data: countBy("ho_tro"), colorIndex: 4 },
    { title: "Học nhóm", data: countBy("hoc_nhom"), colorIndex: 5 },
    { title: "Làm thêm", data: countBy("lam_them"), colorIndex: 0 },
    { title: "Có kinh nghiệm", data: countBy("co_kinh_nghiem"), colorIndex: 1 },
  ];

  const sortedPreviousScores = filtered
    .map((item) => Number(item.diem_qua_trinh) || 0)
    .sort((a, b) => a - b)
    .map((value, index) => ({ name: `#${index + 1}`, value }));

  const chartColors = [
    "#2563eb",
    "#38bdf8",
    "#22c55e",
    "#f59e0b",
    "#f97316",
    "#ef4444",
  ];

  const getColor = (index) => chartColors[index % chartColors.length];

  const renderXAxisTick = ({ x, y, payload }) => {
    const label = payload.value || "";
    const parts = label.split(" (");
    const line1 = parts[0];
    const line2 = parts[1] ? `(${parts[1]}` : null;
    return (
      <g transform={`translate(${x}, ${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#64748b"
          fontSize={10}
        >
          {line1}
        </text>
        {line2 && (
          <text
            x={0}
            y={0}
            dy={32}
            textAnchor="middle"
            fill="#64748b"
            fontSize={10}
          >
            {line2}
          </text>
        )}
      </g>
    );
  };

  function BarChartCard({ title, data, colorIndex = 0 }) {
    // Hàm nhận diện từ khóa để tự động gán màu: Xanh - Cam - Đỏ
    const getBarColor = (name, defaultColor) => {
      if (!name) return defaultColor;
      const text = String(name).toLowerCase();

      // Nhóm XANH LÁ (Thấp, An toàn, Low, Yes, Positive, Near...)
      if (
        text.includes("thấp") ||
        text === "low" ||
        text === "near" ||
        text === "positive" ||
        text === "yes"
      ) {
        return "#22c55e";
      }
      // Nhóm CAM (Trung bình, Medium, Moderate, Neutral...)
      if (
        text.includes("trung bình") ||
        text === "medium" ||
        text === "moderate" ||
        text === "neutral"
      ) {
        return "#f59e0b";
      }
      // Nhóm ĐỎ (Cao, Nguy hiểm, High, No, Negative, Far...)
      if (
        text.includes("cao") ||
        text === "high" ||
        text === "far" ||
        text === "negative" ||
        text === "no"
      ) {
        return "#ef4444";
      }

      return defaultColor; // Nếu không khớp chữ nào thì lấy màu mặc định
    };

    return (
      <div className="card card-body" style={{ minHeight: 260, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
          {title}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={data}
            barSize={20}
            margin={{ top: 10, right: 8, left: 0, bottom: 30 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={renderXAxisTick}
              interval={0}
              height={60}
              tickMargin={4}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
            <Tooltip
              cursor={{ fill: "rgba(37,99,235,0.08)" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
            />
            {/* Gán màu cho từng cột dựa vào hàm getBarColor ở trên */}
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.name, getColor(colorIndex))}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
          {data.length === 0
            ? "Không có dữ liệu hiển thị"
            : "Di chuột để xem chi tiết từng cột."}
        </div>
      </div>
    );
  }

  function RiskScoreChart({ data, colors }) {
    return (
      <div className="card card-body" style={{ padding: 18, minHeight: 320 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Risk Score</span>
          <span style={{ fontSize: 12, color: "#475569" }}>
            Phân bổ sinh viên theo nhóm rủi ro
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              vertical={false}
            />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={170}
              tick={{ fontSize: 12, fill: "#334155", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(15,23,42,0.08)" }}
              formatter={(value) => [`${value} sinh viên`, "Số SV"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
            />
            <Bar dataKey="value" barSize={28} radius={[8, 8, 8, 8]}>
              {data.map((entry, index) => (
                <Cell key={`risk-cell-${index}`} fill={colors[index]} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                offset={10}
                style={{ fill: "#0f172a", fontSize: 12, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            marginTop: 18,
          }}
        >
          {data.map((entry, index) => (
            <div
              key={entry.name}
              style={{
                borderRadius: 12,
                background: "#f8fafc",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: colors[index],
                }}
              />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                {entry.name}
              </div>
              <div
                style={{ fontSize: 20, fontWeight: 800, color: colors[index] }}
              >
                {entry.value}
              </div>
              <div
                style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}
              >
                sinh viên
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1>Quản lý Sinh viên</h1>
          <p>Giám sát và can thiệp rủi ro học thuật dựa trên dữ liệu AI</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          + Thêm sinh viên mới
        </button>
      </div>

      <div
        className="card card-body"
        style={{
          marginBottom: 20,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #dbeafe",
            padding: 18,
            background: "#eff6ff",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#1d4ed8",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Tổng SV dự báo
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8" }}>
            {totalStudents}
          </div>
          <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>
            Tổng số sinh viên có dữ liệu dự báo AI
          </div>
        </div>
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #fecaca",
            padding: 18,
            background: "#fef2f2",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#b91c1c",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            SV nguy cơ cao
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#b91c1c" }}>
            {atRiskCount}
          </div>
          <div style={{ marginTop: 8, color: "#92400e", fontSize: 12 }}>
            Ưu tiên can thiệp ngay với rủi ro cao
          </div>
        </div>
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #fde68a",
            padding: 18,
            background: "#fefce8",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#b45309",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Tỷ lệ báo động đỏ
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#b45309" }}>
            {highRiskPercentage.toFixed(2)}%
          </div>
          <div style={{ marginTop: 8, color: "#92400e", fontSize: 12 }}>
            Phần trăm SV có nguy cơ cao trong tập dữ liệu
          </div>
        </div>
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #fce5dc",
            padding: 18,
            background: "#fdecec00",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#652316",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Rủi ro TB toàn trường
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#652216" }}>
            {avgRiskScore.toFixed(2)}%
          </div>
          <div style={{ marginTop: 8, color: "#7c250f", fontSize: 12 }}>
            Chỉ số trung bình thể hiện mức rủi ro chung
          </div>
        </div>
      </div>

      {Object.keys(atRiskByKhoa).length > 0 && (
        <div className="card card-body" style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Phân tích SV nguy cơ theo Khoa
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Bản đồ ưu tiên can thiệp theo khoa có nhiều sinh viên nguy cơ
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#0f172a",
                background: "#f8fafc",
                borderRadius: 999,
                padding: "8px 14px",
              }}
            >
              Tổng {atRiskCount} SV nguy cơ cao
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {Object.entries(atRiskByKhoa).map(([khoa, count]) => (
              <div
                key={khoa}
                style={{
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: 18,
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                  border: "1px solid #eef2ff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center", // Đổi thành center để nội dung cân đối ở giữa thẻ
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14, // Chữ to hơn một chút
                        fontWeight: 700,
                        color: "#0f172a",
                        marginBottom: 4,
                      }}
                    >
                      {khoa}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Tổng SV nguy cơ
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 28, // Phóng to con số để tạo điểm nhấn
                      fontWeight: 800,
                      color: "#ef4444", // Đổi sang màu đỏ để nhấn mạnh sự rủi ro
                    }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <RiskScoreChart data={riskScoreData} colors={riskScoreColors} />
          <div className="card card-body" style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              📊 11 thuộc tính
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {chartCards.map((item) => (
                <BarChartCard
                  key={item.title}
                  title={item.title}
                  data={item.data}
                  colorIndex={item.colorIndex}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Filters */}
      <div
        className="card card-body"
        style={{
          marginBottom: 20,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--content-bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "7px 12px",
            flex: "1",
            minWidth: 200,
          }}
        >
          <MdSearch style={{ color: "var(--text-secondary)" }} />
          <input
            style={{
              border: "none",
              background: "none",
              outline: "none",
              fontSize: 13,
              width: "100%",
            }}
            placeholder="Tìm MSSV hoặc Tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control form-select"
          style={{ width: 160 }}
          value={filterKhoa}
          onChange={(e) => setFilterKhoa(e.target.value)}
        >
          <option value="all">Khoa: Tất cả</option>
          {studentKhoas.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          className="form-control form-select"
          style={{ width: 180 }}
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
        >
          <option value="all">Mức độ rủi ro: Tất cả</option>
          <option value="high">Rủi ro cao (≥65%)</option>
          <option value="medium">Trung bình (40-65%)</option>
          <option value="low">An toàn (&lt;40%)</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner" />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>MSSV</th>
                  <th>Họ và Tên</th>
                  <th>Khoa/Lớp</th>
                  <th>Cố vấn</th>
                  <th>Rủi ro</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 32,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
                {pagedStudents.map((s) => (
                  <tr key={s.MSSV}>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                      {s.MSSV}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          className="avatar-initials"
                          style={{
                            background: colorFor(s.HoTen),
                            width: 32,
                            height: 32,
                            fontSize: 11,
                          }}
                        >
                          {getInitials(s.HoTen)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{s.HoTen}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {s.Khoa}
                      </div>
                      <div
                        style={{ color: "var(--text-secondary)", fontSize: 12 }}
                      >
                        {s.Lop}
                      </div>
                    </td>
                    <td
                      style={{ color: "var(--text-secondary)", fontSize: 13 }}
                    >
                      {s.TenCoVan}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            (s.risk_score || 0) >= 0.65
                              ? "var(--danger)"
                              : (s.risk_score || 0) >= 0.4
                                ? "var(--warning)"
                                : "var(--success)",
                        }}
                      >
                        {((s.risk_score || 0) * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => {
                          setSelected(s);
                          setAdvice(null);
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div
          className="card-body"
          style={{
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            Hiển thị{" "}
            {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} -{" "}
            {Math.min(currentPage * itemsPerPage, filtered.length)} trên{" "}
            {filtered.length} sinh viên
          </span>
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {Array.from(
              { length: Math.min(5, totalPages) },
              (_, i) => i + 1,
            ).map((p) => (
              <button
                key={p}
                className={`page-btn${currentPage === p ? " active" : ""}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            {totalPages > 5 && (
              <span
                style={{ padding: "0 4px", color: "var(--text-secondary)" }}
              >
                ...
              </span>
            )}
            {totalPages > 5 && (
              <button
                className={`page-btn${currentPage === totalPages ? " active" : ""}`}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            )}
            <button
              className="page-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <>
          <div className="panel-overlay" onClick={() => setSelected(null)} />
          <div className="panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--danger)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  <MdWarning style={{ verticalAlign: "middle" }} /> AI CRITICAL
                  WARNING
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {selected.HoTen}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                  MSSV: {selected.MSSV} • Lớp {selected.Lop}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSelected(null)}>
                <MdClose />
              </button>
            </div>

            {/* Risk probability */}
            <div
              style={{
                background: "#1e293b",
                color: "#fff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                AI RISK PROBABILITY
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 900,
                  margin: "8px 0",
                  color:
                    (selected.risk_score || 0) >= 0.65 ? "#ef4444" : "#f59e0b",
                }}
              >
                {((selected.risk_score || 0) * 100).toFixed(2)}%
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color:
                    (selected.risk_score || 0) >= 0.65
                      ? "#ef4444" // Đỏ (Nguy hiểm)
                      : (selected.risk_score || 0) >= 0.4
                        ? "#f59e0b" // Vàng (Trung bình)
                        : "#10b981", // Xanh (An toàn)
                }}
              >
                {(selected.risk_score || 0) >= 0.65
                  ? "Mức độ rủi ro: NGUY HIỂM. Khả năng thôi học hoặc trượt môn cực cao."
                  : (selected.risk_score || 0) >= 0.4
                    ? "Mức độ rủi ro: TRUNG BÌNH. Cần chú ý theo dõi thêm."
                    : "Mức độ rủi ro: AN TOÀN. Tình hình học tập đang ổn định."}
              </div>
            </div>

            {/* 11 indicators */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                📊 Phân tích 11 chỉ số AI
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                }}
              >
                {detailRows.map((r) => (
                  <div
                    key={r.label}
                    style={{
                      background: "var(--content-bg)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ color: "var(--text-secondary)" }}>
                      {r.label}
                    </div>
                    <div style={{ fontWeight: 700 }}>{r.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasons */}
            {selected.reasons && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  🚩 Lý do cảnh báo
                </div>
                {(() => {
                  try {
                    const list =
                      typeof selected.reasons === "string"
                        ? JSON.parse(selected.reasons)
                        : selected.reasons;
                    const unique = [
                      ...new Set(Array.isArray(list) ? list : [list]),
                    ];
                    return unique.map((r, i) => (
                      <div
                        key={i}
                        className="alert alert-warning"
                        style={{ marginBottom: 6 }}
                      >
                        📍 {r}
                      </div>
                    ));
                  } catch {
                    return (
                      <div className="alert alert-warning">
                        📍 {selected.reasons}
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* AI Advice */}
            {advice ? (
              <div
                className="advice-box"
                style={{
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#065f46",
                  padding: 16,
                  borderRadius: 10,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <strong>🤖 Lời khuyên AI (Mới):</strong>
                </div>
                {formatAdviceText(advice)}
              </div>
            ) : selected.advices && selected.advices.length > 0 ? (
              <div
                className="advice-box"
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bcf0da",
                  color: "#065f46",
                  padding: 16,
                  borderRadius: 10,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {selected.advices.map((adv, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: selected.advices.length > 1 ? "16px" : "0",
                      borderBottom:
                        idx < selected.advices.length - 1
                          ? "1px dashed #a7f3d0"
                          : "none",
                      paddingBottom:
                        idx < selected.advices.length - 1 ? "12px" : "0",
                    }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <strong>🤖 Lời khuyên AI (Đã lưu):</strong>
                    </div>
                    {formatAdviceText(adv)}
                  </div>
                ))}
              </div>
            ) : (
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleGetAdvice}
                disabled={adviceLoading}
              >
                {adviceLoading
                  ? "⚙️ Đang phân tích AI..."
                  : "⚡ AI Tư vấn đề xuất"}
              </button>
            )}
            <p
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "var(--text-secondary)",
                marginTop: 8,
              }}
            >
              Đề xuất gửi email can thiệp cho Phòng Đào Tạo
            </p>
          </div>
        </>
      )}
      {/* THÊM ĐOẠN CODE MODAL NÀY VÀO TRƯỚC THẺ ĐÓNG </div> */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">➕ Thêm Sinh Viên Mới</div>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <MdClose />
              </button>
            </div>

            {msg && (
              <div
                className={`alert alert-${msg.type}`}
                style={{ marginBottom: 16 }}
              >
                {msg.text}
              </div>
            )}

            {formError && (
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label className="form-label">Mã số sinh viên (MSSV) (*)</label>
                <input
                  className="form-control"
                  placeholder="Nhập MSSV..."
                  value={form.MSSV}
                  onChange={(e) => setForm({ ...form, MSSV: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Họ và Tên (*)</label>
                <input
                  className="form-control"
                  placeholder="Nhập họ và tên..."
                  value={form.HoTen}
                  onChange={(e) => setForm({ ...form, HoTen: e.target.value })}
                  required
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div className="form-group">
                  <label className="form-label">Khoa (*)</label>
                  <select
                    className="form-control form-select"
                    value={form.MaKhoa}
                    onChange={async (e) => {
                      const selectedMaKhoa = e.target.value;
                      await loadLops(selectedMaKhoa);
                    }}
                    required
                  >
                    {khoas.map((k) => (
                      <option key={k.MaKhoa} value={k.MaKhoa}>
                        {k.TenKhoa}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ngành (*)</label>
                  {getNganhOptionsForKhoa(form.MaKhoa).length > 0 ? (
                    <select
                      className="form-control form-select"
                      value={form.Nganh}
                      onChange={(e) =>
                        setForm({ ...form, Nganh: e.target.value })
                      }
                      required
                    >
                      <option value="" disabled>
                        Chọn ngành...
                      </option>
                      {getNganhOptionsForKhoa(form.MaKhoa).map((nganh) => (
                        <option key={nganh} value={nganh}>
                          {nganh}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="form-control"
                      placeholder="Nhập ngành (chưa có dữ liệu cho khoa này)"
                      value={form.Nganh}
                      onChange={(e) =>
                        setForm({ ...form, Nganh: e.target.value })
                      }
                      required
                    />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Lớp (*)</label>
                  <select
                    className="form-control form-select"
                    value={form.Lop}
                    onChange={(e) => setForm({ ...form, Lop: e.target.value })}
                    required
                    disabled={lops.length === 0}
                  >
                    <option value="" disabled>
                      {lops.length === 0
                        ? "Chưa có lớp cho khoa này"
                        : "Chọn lớp..."}
                    </option>
                    {lops.map((lop) => (
                      <option key={lop.MaLop} value={lop.MaLop}>
                        {lop.MaLop}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={saving}
                >
                  {saving ? "Đang xử lý..." : "Lưu Sinh Viên"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* HẾT PHẦN MODAL */}
    </div>
  );
}
