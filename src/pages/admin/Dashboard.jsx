import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getDashboardStats,
  getAllResults,
} from "../../services/api";
import { MdPeople, MdWarning, MdTrendingUp, MdAnalytics } from "react-icons/md";
import anh2 from "./anh2.jpg";

function getRiskClass(score) {
  if (score >= 0.8) return "risk-high";
  if (score >= 0.65) return "risk-medium";
  return "risk-low";
}
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
const BG_COLORS = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#db2777"];
function colorFor(name) {
  let s = 0;
  for (const c of name || "") s += c.charCodeAt(0);
  return BG_COLORS[s % BG_COLORS.length];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_sinhvien: 0,
    total_covan: 0,
    total_taikhoan: 0,
  });
  const [latestResults, setLatestResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, dRes] = await Promise.all([
          getDashboardStats(),
          getAllResults(),
        ]);
        setStats(sRes.data);

        const raw = dRes.data || [];
        // Deduplicate by MSSV – keep latest
        const map = {};
        raw.forEach((r) => {
          if (
            !map[r.MSSV] ||
            new Date(r.created_at) > new Date(map[r.MSSV].created_at)
          )
            map[r.MSSV] = r;
        });
        const latest = Object.values(map);
        setLatestResults(latest);

      } catch {}
      setLoading(false);
    }
    load();
  }, [user]);

  const atRisk = latestResults.filter(
    (s) => (s.risk_score || 0) >= 0.65,
  ).length;
  const avgScore = latestResults.length
    ? (
        (latestResults.reduce(
          (a, s) => a + (parseFloat(s.risk_score) || 0),
          0,
        ) /
          latestResults.length) *
        100
      ).toFixed(2)
    : 0;
  const highRiskPct = latestResults.length
    ? ((atRisk / latestResults.length) * 100).toFixed(2)
    : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Tổng quan hệ thống cảnh báo rủi ro học tập</p>
      </div>

      {/* Metric cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Tổng sinh viên</div>
          <div className="metric-value">
            {stats.total_sinhvien?.toLocaleString()}
          </div>
          <div className="metric-icon">
            <MdPeople />
          </div>
        </div>
        <div className="metric-card danger">
          <div className="metric-label">Rủi ro cao</div>
          <div className="metric-value">{atRisk}</div>
          <div className="metric-sub">Cần can thiệp khẩn cấp</div>
          <div className="metric-icon">
            <MdWarning />
          </div>
        </div>
        <div className="metric-card warning">
          <div className="metric-label">Tỷ lệ báo động</div>
          <div className="metric-value">{highRiskPct}%</div>
          <div className="metric-sub">
            <div className="progress-bar" style={{ marginTop: 6 }}>
              <div
                className="progress-fill yellow"
                style={{ width: `${highRiskPct}%` }}
              />
            </div>
          </div>
          <div className="metric-icon">
            <MdTrendingUp />
          </div>
        </div>
        <div className="metric-card dark">
          <div className="metric-label">Điểm rủi ro TB</div>
          <div className="metric-value">{avgScore}</div>
          <div className="metric-icon">
            <MdAnalytics />
          </div>
        </div>
      </div>

      {/* Image section */}
      <div className="card card-body" style={{ marginBottom: 20 }}>
        <div className="chart-header">
          <div>
            <div className="chart-title">Tổng quan rủi ro</div>
            <div className="chart-sub">
              Hình ảnh thay thế cho phần biểu đồ và tóm tắt rủi ro
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <img
            src={anh2}
            alt="anh2"
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: 12,
            }}
          />
        </div>
      </div>
    </div>
  );
}
