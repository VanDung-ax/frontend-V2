import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { changePassword } from "../../services/api";
import {
  MdLockOutline,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdError,
  MdSecurity,
  MdVpnKey
} from "react-icons/md";

export default function DoiMatKhau() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPwd, setShowPwd] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (form.new_password !== form.confirm_password) {
      return setMsg({ type: "danger", text: "Mật khẩu xác nhận không khớp!" });
    }
    if (form.old_password === form.new_password) {
      return setMsg({
        type: "warning",
        text: "Mật khẩu mới phải khác mật khẩu hiện tại.",
      });
    }

    setLoading(true);
    try {
      const response = await changePassword(
        user?.username,
        form.old_password,
        form.new_password
      );

      if (response.data.status === "success") {
        setMsg({
          type: "success",
          text: "Đổi mật khẩu thành công! Lần đăng nhập sau hãy sử dụng mật khẩu mới.",
        });
        setForm({ old_password: "", new_password: "", confirm_password: "" });
      }
    } catch (err) {
      setMsg({
        type: "danger",
        text: err.response?.data?.detail || "Lỗi khi đổi mật khẩu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleShow = (field) => {
    setShowPwd(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const inputStyle = {
    paddingRight: 45, 
    paddingLeft: 45, 
    height: 52, 
    borderRadius: 12, 
    border: '1px solid #e2e8f0', 
    backgroundColor: '#f8fafc',
    fontSize: 15,
    transition: 'all 0.3s ease'
  };

  const iconStyle = {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  };

  const toggleStyle = {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background 0.2s',
  };

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 20px" }}>
      
      {/* Premium Header */}
      <div style={{ 
        textAlign: "center", 
        marginBottom: 40,
        position: 'relative'
      }}>
        <div style={{
          width: 80, height: 80, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          borderRadius: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.1)',
          border: '1px solid #bfdbfe'
        }}>
          <MdSecurity size={40} color="#2563eb" />
        </div>
        <h1 style={{ color: "#1e293b", fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 }}>
          Đổi Mật Khẩu
        </h1>
        <p style={{ color: '#64748b', fontSize: 15 }}>
          Cập nhật khóa bảo mật để bảo vệ tài khoản định danh của bạn
        </p>
      </div>

      <div
        style={{
          background: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)',
          overflow: "hidden",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          borderRadius: 24,
        }}
      >
        <div
          style={{
            background: "linear-gradient(to right, #f8fafc, #ffffff)",
            padding: "20px 32px",
            borderBottom: "1px solid #f1f5f9",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
            Tài khoản thao tác
          </div>
          <div style={{ 
            background: '#eff6ff', color: '#1d4ed8', 
            padding: '4px 12px', borderRadius: 20, 
            fontSize: 13, fontWeight: 700 
          }}>
            {user?.username}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "32px" }}>
          {msg && (
            <div
              style={{
                marginBottom: 28,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: '16px 20px',
                borderRadius: 16,
                background: msg.type === "success" ? "#f0fdf4" : msg.type === "warning" ? "#fffbeb" : "#fef2f2",
                border: `1px solid ${msg.type === "success" ? "#bbf7d0" : msg.type === "warning" ? "#fef08a" : "#fecaca"}`,
                color: msg.type === "success" ? "#166534" : msg.type === "warning" ? "#92400e" : "#991b1b"
              }}
            >
              <div style={{ marginTop: 2 }}>
                {msg.type === "success" ? (
                  <MdCheckCircle size={22} color="#16a34a" />
                ) : (
                  <MdError size={22} color={msg.type === "warning" ? "#d97706" : "#dc2626"} />
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
                {msg.text}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'block' }}>
                Mật khẩu hiện tại
              </label>
              <div style={{ position: "relative" }}>
                <MdLockOutline size={20} style={iconStyle} />
                <input
                  type={showPwd.old ? "text" : "password"}
                  className="form-control"
                  style={inputStyle}
                  placeholder="Nhập mật khẩu cũ..."
                  value={form.old_password}
                  onChange={(e) => setForm({ ...form, old_password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => toggleShow('old')} style={toggleStyle}>
                  {showPwd.old ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'block' }}>
                Mật khẩu mới
              </label>
              <div style={{ position: "relative" }}>
                <MdVpnKey size={20} style={iconStyle} />
                <input
                  type={showPwd.new ? "text" : "password"}
                  className="form-control"
                  style={inputStyle}
                  placeholder="Tạo mật khẩu mới..."
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => toggleShow('new')} style={toggleStyle}>
                  {showPwd.new ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'block' }}>
                Xác nhận mật khẩu mới
              </label>
              <div style={{ position: "relative" }}>
                <MdVpnKey size={20} style={iconStyle} />
                <input
                  type={showPwd.confirm ? "text" : "password"}
                  className="form-control"
                  style={inputStyle}
                  placeholder="Nhập lại mật khẩu mới..."
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => toggleShow('confirm')} style={toggleStyle}>
                  {showPwd.confirm ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 52,
              marginTop: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: "center",
              gap: 10,
              background: "linear-gradient(135deg, #1e3a5f 0%, #152b47 100%)",
              color: '#fff',
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 10px 20px -10px rgba(30, 58, 95, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> 
                Đang cập nhật...
              </>
            ) : (
              "Lưu mật khẩu mới"
            )}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#94a3b8", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <MdLockOutline size={14} />
          Mật khẩu của bạn được mã hóa an toàn trên hệ thống.
        </p>
      </div>
    </div>
  );
}
