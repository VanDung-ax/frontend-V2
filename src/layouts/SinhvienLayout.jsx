import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  MdPerson, MdWarning, MdLogout, MdShield,
  MdRoute, MdQuiz, MdTrendingUp, MdLock, MdAutoAwesome
} from "react-icons/md";

function getInitials(name) {
  if (!name) return "S";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const NAV_LINKS = [
  { to: "/sinhvien/thong-tin", icon: <MdPerson />, label: "Thông tin cá nhân" },
  { to: "/sinhvien/rui-ro", icon: <MdWarning />, label: "Rủi ro học tập" },
  { to: "/sinhvien/lo-trinh", icon: <MdRoute />, label: "Lộ trình học tập" },
  { to: "/sinhvien/bai-tap", icon: <MdQuiz />, label: "Bài tập & Test" },
  { to: "/sinhvien/bai-tap-ai", icon: <MdAutoAwesome />, label: "Bài tập AI" },
  { to: "/sinhvien/tien-bo", icon: <MdTrendingUp />, label: "Tiến bộ của tôi" },
  { to: "/sinhvien/doi-mat-khau", icon: <MdLock />, label: "Đổi mật khẩu" },
];

export default function SinhvienLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--content-bg)" }}>
      <header style={{
        background: "var(--card-bg)",
        borderBottom: "1px solid var(--border)",
        padding: "0 28px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "var(--shadow-sm)",
        position: "sticky", top: 0, zIndex: 100
      }}>
        {/* Left: Logo + Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
            <div style={{
              width: 32, height: 32, background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16
            }}>
              <MdShield />
            </div>
            <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
              Early Warning
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 2, flexWrap: "nowrap" }}>
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  padding: "7px 13px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: isActive ? "#6366f1" : "var(--text-secondary)",
                  background: isActive ? "#eff6ff" : "none",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                })}
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: User + Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 13
          }}>
            {getInitials(user?.display_name || user?.username)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.display_name || user?.username}</div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Sinh viên · {user?.linked_id}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            <MdLogout /> Đăng xuất
          </button>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
