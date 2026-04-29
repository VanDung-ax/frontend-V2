// src/pages/admin/Thongkead.jsx
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Button,
  Space,
  Divider,
} from "antd";
// Dùng Lucide Icons sắc sảo
import {
  Users,
  AlertTriangle,
  AlertOctagon,
  Zap,
  Target,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { Pie, Area } from "@ant-design/charts";
import axios from "axios";
import moment from "moment";

const { Title, Text } = Typography;

const API_BASE = "http://127.0.0.1:8001/api/v2";

const ThongKeAd = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    metrics: {},
    pieChartData: [],
    areaChartData: [],
  });

  // Giữ nguyên logic fetch data cũ của bạn
  const fetchDataAndProcess = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, resultsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/student/all`),
        axios.get(`${API_BASE}/data/all-results`),
        axios.get(`${API_BASE}/admin/dashboard-stats`), // Giả sử có API lấy stats nhanh
      ]);

      const studentsAll = studentsRes.data || [];
      const resultsAll = resultsRes.data || [];

      if (studentsAll.length === 0) {
        setData((prev) => ({ ...prev, metrics: {} }));
        return;
      }

      // Xử lý logic dự báo mới nhất (Giữ nguyên cũ)
      let resultsProcessed = resultsAll.map((item) => ({
        ...item,
        created_at_dt: moment(item.created_at),
      }));
      resultsProcessed.sort((a, b) => b.created_at_dt - a.created_at_dt);
      const resultsLatestMap = new Map();
      resultsProcessed.forEach((item) => {
        if (!resultsLatestMap.has(item.MSSV))
          resultsLatestMap.set(item.MSSV, item);
      });
      const resultsLatest = Array.from(resultsLatestMap.values());
      const highRiskResults = resultsLatest.filter(
        (item) => item.risk_score >= 0.65,
      );

      // --- TÍNH TOÁN METRICS (CHỈ SỐ TỔNG QUAN) ---
      const totalStudents = studentsAll.length;
      const totalHighRisk = highRiskResults.length;
      const totalAdvisors = statsRes.data?.total_covan || 0; // Lấy từ API stats nhanh
      const flawedRiskScore = (totalHighRisk / totalStudents) * 100;
      const sumRiskScore = resultsLatest.reduce(
        (sum, item) => sum + item.risk_score,
        0,
      );
      const avgRiskScore =
        resultsLatest.length > 0
          ? (sumRiskScore / resultsLatest.length) * 100
          : 0;

      const metrics = {
        totalStudents: totalStudents.toLocaleString("vi-VN"),
        totalHighRisk: totalHighRisk.toLocaleString("vi-VN"),
        flawedRiskScore: `${flawedRiskScore.toFixed(2)}%`,
        avgRiskScore: `${avgRiskScore.toFixed(2)}%`,
      };

      // --- CHUẨN BỊ DỮ LIỆU BIỂU ĐỒ (Đổi bộ màu chuẩn Teal) ---
      const pieMap = new Map();
      highRiskResults.forEach((result) => {
        const student = studentsAll.find((s) => s.MSSV === result.MSSV);
        if (student && student.TenKhoa)
          pieMap.set(student.TenKhoa, (pieMap.get(student.TenKhoa) || 0) + 1);
      });
      const pieChartData = Array.from(pieMap.entries()).map(
        ([khoa, count]) => ({ type: khoa, value: count }),
      );

      const resultsBinnedProcessed = resultsAll.map((item) => ({
        ...item,
        version: moment(item.created_at).format("DD/MM"), // Đơn giản hóa trục X
      }));
      resultsBinnedProcessed.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
      const groupedData = resultsBinnedProcessed.reduce((groups, item) => {
        const key = `${item.version}_${item.risk_level}`;
        if (!groups[key])
          groups[key] = {
            version: item.version,
            risk_level: item.risk_level,
            count: 0,
          };
        groups[key].count += 1;
        return groups;
      }, {});
      const areaChartData = Array.from(Object.values(groupedData)).slice(-10); // Lấy 10 phiên bản gần nhất

      setData({ metrics, pieChartData, areaChartData });
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối Backend. Vui lòng bật Server Backend cổng 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataAndProcess();
  }, []);

  // --- CẤU HÌNH CÁC BIỂU ĐỒ (DARK MODE & TEAL COLORS) ---
  const sharedChartTheme = {
    background: "transparent",
    color10: ["#2dd4bf", "#06b6d4", "#0891b2", "#0e7490", "#155e75"], // Bộ Teal/Cyan spectrum
  };

  const pieConfig = {
    ...sharedChartTheme,
    appendPadding: 10,
    data: data.pieChartData,
    angleField: "value",
    colorField: "type",
    radius: 1,
    innerRadius: 0.7, // Biểu đồ Donut sắc sảo hơn
    label: {
      type: "inner",
      offset: "-50%",
      content: "{percentage}",
      style: { fontSize: 12, textAlign: "center", fill: "white" },
    },
    interactions: [{ type: "element-selected" }, { type: "element-active" }],
    statistic: {
      title: false,
      content: {
        style: { whiteSpace: "pre-wrap", color: "white", fontSize: "14px" },
        content: "SV Rủi ro cao",
      },
    },
    legend: { position: "bottom", text: { style: { fill: "#9ca3af" } } },
  };

  const areaConfig = {
    ...sharedChartTheme,
    data: data.areaChartData,
    xField: "version",
    yField: "count",
    seriesField: "risk_level",
    stack: true,
    smooth: true, // Đường cong mượt mà như hình mẫu
    xAxis: { title: false, label: { style: { fill: "#9ca3af" } } },
    yAxis: {
      title: { text: "Số lượng SV", style: { fill: "#9ca3af" } },
      grid: { line: { style: { stroke: "rgba(255,255,255,0.03)" } } },
      label: { style: { fill: "#9ca3af" } },
    },
    legend: { position: "top-left", text: { style: { fill: "#9ca3af" } } },
    areaStyle: () => {
      return { fillOpacity: 0.1 };
    }, // Hiệu ứng trong suốt vùng
  };

  // Helper function render các thẻ Stats tối
  const renderStatCard = (icon, title, value, unit, color) => (
    <div className="custom-card" style={{ height: "100%" }}>
      <div
        className="custom-card-body"
        style={{ display: "flex", alignItems: "center", gap: "20px" }}
      >
        <div
          style={{
            padding: "15px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "4px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: color || "white",
              fontSize: "28px",
              fontWeight: "bold",
              lineHeight: "1",
            }}
          >
            {value}{" "}
            <span
              style={{
                fontSize: "16px",
                fontWeight: "normal",
                color: "#9ca3af",
              }}
            >
              {unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  if (error)
    return (
      <Alert
        message="Lỗi hệ thống"
        description={error}
        type="error"
        showIcon
        style={{
          background: "#111827",
          color: "white",
          border: "1px solid rgba(245,34,45,0.2)",
        }}
      />
    );

  return (
    <div>
      {/* PAGE HEADER - styled like image */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <Title
          level={3}
          style={{ color: "white", margin: 0, fontWeight: "600" }}
        >
          Tổng quan
        </Title>
        <Space size="small">
          <Button
            type="default"
            icon={<Maximize2 size={16} />}
            style={{
              borderRadius: "8px",
              background: "#111827",
              color: "white",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            Mở rộng
          </Button>
          <Button
            type="primary"
            icon={<RotateCcw size={16} />}
            style={{
              borderRadius: "8px",
              background: "#2dd4bf",
              border: "none",
              color: "#0a0e17",
            }}
            onClick={fetchDataAndProcess}
          >
            Làm mới dữ liệu
          </Button>
        </Space>
      </div>

      {/* 5 THẺ CHỈ SỐ STATS (Thay thế defaulting thống kê cũ) */}
      <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
        <Col span={24 / 5}>
          {renderStatCard(
            <Users size={24} style={{ color: "#2dd4bf" }} />,
            "Tổng sinh viên",
            data.metrics.totalStudents,
            "SV",
          )}
        </Col>
        <Col span={24 / 5}>
          {renderStatCard(
            <AlertOctagon size={24} style={{ color: "#fb923c" }} />,
            "SV Nguy cơ cao",
            data.metrics.totalHighRisk,
            "SV",
            "#fb923c",
          )}
        </Col>
        <Col span={24 / 5}>
          {renderStatCard(
            <AlertTriangle size={24} style={{ color: "#f87171" }} />,
            "Điểm Cảnh Báo",
            data.metrics.flawedRiskScore,
            "",
            "#f87171",
          )}
        </Col>
        <Col span={24 / 5}>
          {renderStatCard(
            <Target size={24} style={{ color: "#4ade80" }} />,
            "Số Cố vấn",
            "25",
            "GV",
          )}
        </Col>
        <Col span={24 / 5}>
          {renderStatCard(
            <Zap size={24} style={{ color: "#a78bfa" }} />,
            "Rủi ro TB (AI)",
            data.metrics.avgRiskScore,
            "",
            "#a78bfa",
          )}
        </Col>
      </Row>

      {/* CÁC BIỂU ĐỒ (Custom Styled Cards) */}
      <Row gutter={[16, 16]}>
        <Col span={15}>
          <div className="custom-card">
            <div className="custom-card-header">
              📊 Hoạt động Cảnh báo (Area Chart)
            </div>
            <div
              className="custom-card-body"
              style={{ padding: "20px 20px 5px 10px" }}
            >
              <Area {...areaConfig} height={350} />
            </div>
          </div>
        </Col>
        <Col span={9}>
          <div className="custom-card">
            <div className="custom-card-header">
              🧩 Phân bố SV Nguy cơ theo Khoa
            </div>
            <div className="custom-card-body" style={{ padding: "20px 10px" }}>
              <Pie {...pieConfig} height={350} />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ThongKeAd;
