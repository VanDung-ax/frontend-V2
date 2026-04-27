import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminLayout from './layouts/AdminLayout'
import SinhvienLayout from './layouts/SinhvienLayout'

// ── Admin / Phòng Đào Tạo ─────────────────────────
import Dashboard from './pages/admin/Dashboard'
import QuanLySinhVien from './pages/admin/QuanLySinhVien'
import QuanLyTaiKhoan from './pages/admin/QuanLyTaiKhoan'
import UploadAI from './pages/admin/UploadAI'

// ── Sinh viên ─────────────────────────────────────
import ThongTinCaNhan from './pages/sinhvien/ThongTinCaNhan'
import ThongTinRuiRo from './pages/sinhvien/ThongTinRuiRo'
import DoiMatKhau from './pages/sinhvien/DoiMatKhau'
import LoTrinhHocTap from './pages/sinhvien/LoTrinhHocTap'
import BaiTapTest from './pages/sinhvien/BaiTapTest'
import AIBaiTapTest from './pages/sinhvien/AIBaiTapTest'
import TienBoSoSanh from './pages/sinhvien/TienBoSoSanh'

function PrivateRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'sinhvien') return <Navigate to="/sinhvien/thong-tin" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <div className="spinner" />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Phòng Đào Tạo (Admin) Routes */}
      <Route path="/admin" element={
        <PrivateRoute allowedRoles={['admin']}><AdminLayout /></PrivateRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="quan-ly-sinh-vien" element={<QuanLySinhVien />} />
        <Route path="quan-ly-tai-khoan" element={<QuanLyTaiKhoan />} />
        <Route path="upload-ai" element={<UploadAI />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Sinh viên Routes */}
      <Route path="/sinhvien" element={
        <PrivateRoute allowedRoles={['sinhvien']}><SinhvienLayout /></PrivateRoute>
      }>
        <Route path="thong-tin" element={<ThongTinCaNhan />} />
        <Route path="rui-ro" element={<ThongTinRuiRo />} />
        <Route path="lo-trinh" element={<LoTrinhHocTap />} />
        <Route path="bai-tap" element={<BaiTapTest />} />
        <Route path="bai-tap-ai" element={<AIBaiTapTest />} />
        <Route path="tien-bo" element={<TienBoSoSanh />} />
        <Route path="doi-mat-khau" element={<DoiMatKhau />} />
        <Route index element={<Navigate to="thong-tin" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
