import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  MdPerson, MdWarning, MdLogout, MdShield,
  MdRoute, MdQuiz, MdTrendingUp, MdLock, MdAutoAwesome, MdFingerprint
} from "react-icons/md";

function getInitials(name) {
  if (!name) return "S";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const NAV_LINKS = [
  { to: "/sinhvien/thong-tin", icon: <MdPerson size={18} />, label: "THÔNG TIN CÁ NHÂN" },
  { to: "/sinhvien/rui-ro", icon: <MdWarning size={18} />, label: "RỦI RO HỌC TẬP" },
  { to: "/sinhvien/lo-trinh", icon: <MdRoute size={18} />, label: "LỘ TRÌNH HỌC TẬP" },
  { to: "/sinhvien/bai-tap", icon: <MdQuiz size={18} />, label: "BÀI TẬP & TEST" },
  { to: "/sinhvien/bai-tap-ai", icon: <MdAutoAwesome size={18} />, label: "BÀI TẬP AI" },
  { to: "/sinhvien/tien-bo", icon: <MdTrendingUp size={18} />, label: "TIẾN BỘ CỦA TÔI" },
  { to: "/sinhvien/doi-mat-khau", icon: <MdLock size={18} />, label: "ĐỔI MẬT KHẨU" },
];

export default function SinhvienLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="cyber-theme cyber-layout">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="cyber-sidebar">
        <div className="cyber-sidebar-header">
          <div className="cyber-logo-text">CORE_PORTAL_V1</div>
        </div>

        <div style={{ padding: "24px 20px 10px" }}>
          <div style={{ 
            background: "rgba(0, 240, 255, 0.05)", 
            border: "1px solid var(--cyber-accent)", 
            borderRadius: 8, 
            padding: "16px",
            display: "flex", alignItems: "center", gap: 14
          }}>
            <div className="cyber-avatar">
              <MdFingerprint size={24} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--cyber-accent)", letterSpacing: 1 }}>ID: STUDENT_ID_{user?.linked_id || "000"}</div>
              <div style={{ fontSize: 10, color: "var(--cyber-success)", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyber-success)", boxShadow: "var(--cyber-success-glow)" }}></span>
                Status: Online
              </div>
            </div>
          </div>
        </div>

        <nav className="cyber-nav">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `cyber-nav-item ${isActive ? "active" : ""}`}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid var(--cyber-border)" }}>
          <div style={{ fontSize: 10, color: "var(--cyber-text-muted)", marginBottom: 8, letterSpacing: 1 }}>SYSTEM LOAD: 24%</div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: "24%", height: "100%", background: "var(--cyber-accent)", boxShadow: "var(--cyber-accent-glow)" }}></div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────── */}
      <div className="cyber-main">
        <header className="cyber-topbar">
          <div style={{ display: "flex", gap: 32 }}>
            {["DASHBOARD", "ANALYTICS", "RESOURCES"].map((item, i) => (
              <div key={item} style={{ 
                color: i === 0 ? "var(--cyber-accent)" : "var(--cyber-text-muted)",
                fontSize: 12, fontWeight: 700, letterSpacing: 2, cursor: "pointer",
                borderBottom: i === 0 ? "2px solid var(--cyber-accent)" : "none",
                paddingBottom: 6, paddingTop: 6
              }}>
                {item}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button className="cyber-btn" onClick={handleLogout} style={{ padding: "6px 14px", fontSize: 10 }}>
              <MdLogout size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
              LOGOUT
            </button>
            <div className="cyber-avatar" style={{ width: 32, height: 32, borderRadius: "50%" }}>
              {getInitials(user?.display_name || user?.username)}
            </div>
          </div>
        </header>

        <main className="cyber-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
