import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  MdPerson, MdWarning, MdLogout, MdSettings,
  MdRoute, MdQuiz, MdTrendingUp, MdAutoAwesome,
  MdSearch, MdNotificationsNone, MdLock
} from "react-icons/md";

function getInitials(name) {
  if (!name) return "S";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const SIDEBAR_LINKS = [
  { to: "/sinhvien/thong-tin", icon: <MdPerson size={20} />, label: "Thông tin cá nhân" },
  { to: "/sinhvien/rui-ro", icon: <MdWarning size={20} />, label: "Rủi ro học tập" },
  { to: "/sinhvien/lo-trinh", icon: <MdRoute size={20} />, label: "Lộ trình học tập" },
  { to: "/sinhvien/bai-tap", icon: <MdQuiz size={20} />, label: "Bài test tâm lý và kỹ năng mềm" },
  { to: "/sinhvien/bai-tap-ai", icon: <MdAutoAwesome size={20} />, label: "Bài tập ôn lại kiến thức" },
  { to: "/sinhvien/tien-bo", icon: <MdTrendingUp size={20} />, label: "Tiến bộ của tôi" },
];

export default function SinhvienLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="uni-layout">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="uni-sidebar">
        <div className="uni-sidebar-header">
          <div className="uni-logo-text">Cảnh báo rớt môn</div>
        </div>

        <div className="uni-sidebar-profile">
          <img src={`https://ui-avatars.com/api/?name=${user?.display_name || 'Sinh viên'}&background=random`} alt="Ảnh đại diện" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{user?.display_name || "Học viên"}</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>MSSV: {user?.linked_id || "Chưa có"}</div>
          </div>
        </div>

        <nav className="uni-nav">
          {SIDEBAR_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `uni-nav-item ${isActive ? "active" : ""}`}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="uni-sidebar-footer">
          <NavLink to="/sinhvien/doi-mat-khau" className="uni-sidebar-footer-link">
            <MdLock size={18} /> Đổi mật khẩu
          </NavLink>
          <button 
            className="uni-sidebar-footer-link" 
            onClick={handleLogout}
            style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#fca5a5' }}
          >
            <MdLogout size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────── */}
      <div className="uni-main">
        <header className="uni-topbar">
          <div className="uni-topbar-nav">
            {/* Topbar links removed - real links are in sidebar */}
          </div>

          <div className="uni-topbar-right">
            <img 
              src={`https://ui-avatars.com/api/?name=${user?.display_name || 'Sinh viên'}&background=0D8ABC&color=fff`} 
              alt="Ảnh đại diện" 
              style={{ width: 32, height: 32, borderRadius: "50%", cursor: "pointer" }}
            />
          </div>
        </header>

        <main className="uni-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
