import { useState, useEffect } from "react";
import {
  getAllAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
} from "../../services/api";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdClose,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";

function getInitials(name) {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}
const BG = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#db2777"];
function colorFor(name) {
  let s = 0;
  for (const c of name || "") s += c.charCodeAt(0);
  return BG[s % BG.length];
}

export default function QuanLyTaiKhoan() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modal, setModal] = useState(null); // 'add' | 'edit'
  const [editData, setEditData] = useState({});
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "sinhvien",
    MSSV_LienKet: "",
    Id_CoVan_LienKet: "",
  });
  const [msg, setMsg] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  // State để quản lý việc ẩn/hiện mật khẩu
  const [showPwd, setShowPwd] = useState({}); // Cho bảng danh sách
  const [showFormPwd, setShowFormPwd] = useState(false); // Cho form nhập liệu

  const load = async () => {
    setLoading(true);
    try {
      const r = await getAllAccounts();
      setAccounts(r.data || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = accounts.filter((a) => {
    const matchRole = roleFilter === "all" || a.role === roleFilter;
    const matchSearch =
      !search ||
      a.username?.toLowerCase().includes(search.toLowerCase()) ||
      String(a.MSSV_LienKet || "").includes(search) ||
      String(a.Id_CoVan_LienKet || "").includes(search);
    return matchRole && matchSearch;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addAccount({
        ...form,
        MSSV_LienKet: form.MSSV_LienKet || null,
        Id_CoVan_LienKet: form.Id_CoVan_LienKet
          ? parseInt(form.Id_CoVan_LienKet)
          : null,
      });
      setMsg({ type: "success", text: "Thêm tài khoản thành công!" });
      setModal(null);
      load();
    } catch {
      setMsg({ type: "danger", text: "Lỗi khi thêm tài khoản." });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = { role: editData.role };
      if (editData.password) payload.password = editData.password;
      if (editData.MSSV_LienKet !== undefined)
        payload.MSSV_LienKet = editData.MSSV_LienKet || null;
      if (editData.Id_CoVan_LienKet !== undefined)
        payload.Id_CoVan_LienKet = editData.Id_CoVan_LienKet
          ? parseInt(editData.Id_CoVan_LienKet)
          : null;
      await updateAccount(editData.id, payload);
      setMsg({ type: "success", text: "Cập nhật thành công!" });
      setModal(null);
      load();
    } catch {
      setMsg({ type: "danger", text: "Lỗi cập nhật." });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa tài khoản này?")) return;
    try {
      await deleteAccount(id);
      setMsg({ type: "success", text: "Đã xóa!" });
      load();
    } catch {
      setMsg({ type: "danger", text: "Lỗi khi xóa." });
    }
  };

  const roleBadge = (role) => {
    if (role === "admin")
      return <span className="badge badge-admin">ADMIN</span>;
    if (role === "covan")
      return <span className="badge badge-covan">CỐ VẤN</span>;
    return <span className="badge badge-sinhvien">SINH VIÊN</span>;
  };

  // Hàm toggle ẩn/hiện mật khẩu cho từng dòng trong bảng
  const toggleRowPwd = (id) => {
    setShowPwd((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const adminCount = accounts.filter((a) => a.role === "admin").length;
  const covanCount = accounts.filter((a) => a.role === "covan").length;
  const svCount = accounts.filter((a) => a.role === "sinhvien").length;

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
          <h1>Quản lý Tài khoản</h1>
          <p>Quản lý tất cả tài khoản người dùng trong hệ thống</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm({
              username: "",
              password: "",
              role: "sinhvien",
              MSSV_LienKet: "",
              Id_CoVan_LienKet: "",
            });
            setShowFormPwd(false); // Reset trạng thái hiển thị MK
            setModal("add");
          }}
        >
          <MdAdd /> Thêm tài khoản
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 16,
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <div className="card card-body">
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "var(--text-secondary)",
              marginBottom: 8,
            }}
          >
            Tài khoản Sinh viên
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {svCount.toLocaleString()}
          </div>
        </div>
        <div className="card card-body">
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "var(--text-secondary)",
              marginBottom: 8,
            }}
          >
            Tài khoản Admin
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {adminCount.toLocaleString()}
          </div>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
          {msg.text}{" "}
          <button
            onClick={() => setMsg(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginLeft: "auto",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            fontWeight: 600,
          }}
        >
          LỌC THEO:
        </span>
        <div className="filter-chips">
          {[
            ["all", "Tất cả"],
            ["admin", "Admin"],
            ["sinhvien", "Sinh viên"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={`chip${roleFilter === v ? " active" : ""}`}
              onClick={() => {
                setRoleFilter(v);
                setPage(1);
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "6px 12px",
            width: 240,
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
            placeholder="Tìm kiếm tài khoản..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner" />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>USERNAME</th>
                  <th>MẬT KHẨU</th> {/* THÊM CỘT MẬT KHẨU Ở ĐÂY */}
                  <th>ROLE</th>
                  <th>ID LIÊN KẾT</th>
                  <th>TRẠNG THÁI</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 32,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Không có tài khoản
                    </td>
                  </tr>
                )}
                {paged.map((a) => (
                  <tr key={a.id}>
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
                            background: colorFor(a.username),
                            width: 34,
                            height: 34,
                            fontSize: 12,
                          }}
                        >
                          {getInitials(a.username)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{a.username}</div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {a.username}@edu.vn
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CỘT HIỂN THỊ MẬT KHẨU CÓ ICON CON MẮT */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 13,
                            letterSpacing: showPwd[a.id] ? "normal" : "2px",
                            fontWeight: showPwd[a.id] ? 600 : 900,
                          }}
                        >
                          {showPwd[a.id]
                            ? a.password || "Chưa thiết lập"
                            : "••••••••"}
                        </span>
                        <button
                          type="button"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onClick={() => toggleRowPwd(a.id)}
                          title={
                            showPwd[a.id] ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                          }
                        >
                          {showPwd[a.id] ? (
                            <MdVisibilityOff size={18} />
                          ) : (
                            <MdVisibility size={18} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td>{roleBadge(a.role)}</td>
                    <td
                      style={{
                        fontFamily: "monospace",
                        fontSize: 13,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {a.MSSV_LienKet
                        ? `SV-${a.MSSV_LienKet}`
                        : a.Id_CoVan_LienKet
                          ? `CV-${a.Id_CoVan_LienKet}`
                          : a.role === "admin"
                            ? "ADM-ADMIN"
                            : "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                        }}
                      >
                        <span className="status-dot active" />
                        Hoạt động
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => {
                            setEditData({ ...a, password: "" });
                            setShowFormPwd(false); // Reset trạng thái hiển thị MK
                            setModal("edit");
                          }}
                        >
                          <MdEdit />
                        </button>
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => handleDelete(a.id)}
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination + summary */}
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
            Hiển thị {(page - 1) * PER_PAGE + 1} -{" "}
            {Math.min(page * PER_PAGE, filtered.length)} trên tổng số{" "}
            {filtered.length} tài khoản
          </span>
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹
            </button>
            {Array.from(
              { length: Math.min(5, totalPages) },
              (_, i) => i + 1,
            ).map((p) => (
              <button
                key={p}
                className={`page-btn${page === p ? " active" : ""}`}
                onClick={() => setPage(p)}
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
                className={`page-btn${page === totalPages ? " active" : ""}`}
                onClick={() => setPage(totalPages)}
              >
                {totalPages}
              </button>
            )}
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {modal === "add"
                  ? "➕ Thêm tài khoản mới"
                  : "✏️ Chỉnh sửa tài khoản"}
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={modal === "add" ? handleAdd : handleEdit}>
              {modal === "add" && (
                <div className="form-group">
                  <label className="form-label">Tên đăng nhập (*)</label>
                  <input
                    className="form-control"
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                    required
                  />
                </div>
              )}

              {/* KHUNG NHẬP MẬT KHẨU CÓ ICON CON MẮT */}
              <div className="form-group">
                <label className="form-label">
                  Mật khẩu{" "}
                  {modal === "edit" ? "(để trống nếu không đổi)" : "(*)"}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className="form-control"
                    type={showFormPwd ? "text" : "password"}
                    value={
                      modal === "add" ? form.password : editData.password || ""
                    }
                    onChange={(e) =>
                      modal === "add"
                        ? setForm((f) => ({ ...f, password: e.target.value }))
                        : setEditData((d) => ({
                            ...d,
                            password: e.target.value,
                          }))
                    }
                    required={modal === "add"}
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                    }}
                    onClick={() => setShowFormPwd(!showFormPwd)}
                  >
                    {showFormPwd ? (
                      <MdVisibilityOff size={20} />
                    ) : (
                      <MdVisibility size={20} />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vai trò (*)</label>
                <select
                  className="form-control form-select"
                  value={modal === "add" ? form.role : editData.role}
                  onChange={(e) =>
                    modal === "add"
                      ? setForm((f) => ({ ...f, role: e.target.value }))
                      : setEditData((d) => ({ ...d, role: e.target.value }))
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="sinhvien">Sinh viên</option>
                </select>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 12,
                }}
              >
                <div className="form-group">
                  <label className="form-label">MSSV Liên kết</label>
                  <input
                    className="form-control"
                    value={
                      modal === "add"
                        ? form.MSSV_LienKet
                        : editData.MSSV_LienKet || ""
                    }
                    onChange={(e) =>
                      modal === "add"
                        ? setForm((f) => ({
                            ...f,
                            MSSV_LienKet: e.target.value,
                          }))
                        : setEditData((d) => ({
                            ...d,
                            MSSV_LienKet: e.target.value,
                          }))
                    }
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {modal === "add" ? "Thêm vào hệ thống" : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModal(null)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
