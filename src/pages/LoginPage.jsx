import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { login as loginAPI } from "../services/api";

import {
  MdShield,
  MdPerson,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginAPI(username, password);
      const userData = res.data;
      login(userData);
      if (userData.role === "admin") navigate("/admin/dashboard");
      else if (userData.role === "covan") navigate("/covan/tong-quan");
      else if (userData.role === "sinhvien") navigate("/sinhvien/thong-tin");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Tài khoản hoặc mật khẩu không chính xác",
      );
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Background grid effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 460,
          padding: "0 16px",
          position: "relative",
        }}
      >
        <div className="login-card">
          <div className="login-icon">
            <MdShield size={28} />
          </div>
          <h1 className="login-title">Hệ thống dự báo rủi ro rớt môn</h1>
          <p className="login-sub">Chào mừng quay trở lại</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tên đăng nhập hoặc Email</label>
              <div style={{ position: "relative" }}>
                <MdPerson
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                    fontSize: 18,
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: 38 }}
                  placeholder="Nhập tài khoản của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div style={{ position: "relative" }}>
                <MdLock
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                    fontSize: 18,
                  }}
                />
                <input
                  type={showPw ? "text" : "password"}
                  className="form-control"
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    fontSize: 18,
                    display: "flex",
                  }}
                >
                  {showPw ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                fontSize: 13,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                <input type="checkbox" /> Ghi nhớ đăng nhập
              </label>
            </div>

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 10,
                background: "#0f172a",
              }}
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            Hệ thống quản lý nội bộ. Quyền truy cập được giám sát.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 24,
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <span>© 2024 Hệ thống dự báo REAAC</span>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ cursor: "pointer" }}>Privacy Policy</span>
            <span style={{ cursor: "pointer" }}>Terms of Service</span>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
              }}
            />
            HỆ THỐNG ĐANG HOẠT ĐỘNG
            <span style={{ marginLeft: 8 }}>v2.4.0-release</span>
          </span>
        </div>
      </div>
    </div>
  );
}
