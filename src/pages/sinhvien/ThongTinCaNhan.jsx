import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getStudent, getAllResults } from '../../services/api'
import { MdPerson, MdSchool, MdBusiness, MdBadge, MdShield } from 'react-icons/md'

// Circular gauge SVG component
function CircularGauge({ percent, size = 120 }) {
  const radius = 44
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  const arc = circumference * 0.75 // 270 degree arc
  const offset = arc - (arc * Math.min(percent, 100)) / 100
  const color = percent >= 65 ? '#dc2626' : percent >= 40 ? '#d97706' : '#1e3a5f'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none" stroke="#e2e8f0" strokeWidth={8}
        strokeDasharray={`${arc} ${circumference}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
      />
      {/* Filled arc */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${arc} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      {/* Label */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="900" fill={color}>
        {percent.toFixed(2)}%
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600" letterSpacing="1">
        RỦI RO
      </text>
    </svg>
  )
}

export default function ThongTinCaNhan() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [riskData, setRiskData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const mssv = user?.linked_id
        if (!mssv) { setError('Không tìm thấy MSSV liên kết.'); setLoading(false); return }
        const [svRes, riskRes] = await Promise.all([
          getStudent(mssv),
          getAllResults(user?.id, 'khoa').catch(() => ({ data: [] }))
        ])
        setData(svRes.data)
        // Find latest risk record for this student
        const raw = riskRes.data || []
        const mine = raw.filter(r => String(r.MSSV) === String(mssv))
        if (mine.length > 0) {
          const latest = mine.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b)
          setRiskData(latest)
        }
      } catch { setError('Không thể tải thông tin sinh viên từ máy chủ.') }
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div className="spinner" />
    </div>
  )
  if (error) return <div className="alert alert-danger">{error}</div>

  const initials = data?.HoTen?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || 'SV'
  const riskPct = riskData ? (riskData.risk_score || 0) * 100 : 0
  const attendancePct = riskData ? (parseFloat(riskData.chuyen_can) || 0) : 0
  const gpa = riskData ? ((parseFloat(riskData.diem_qua_trinh) || 0) * 0.4).toFixed(1) : '—'

  const infoItems = [
    { icon: <MdBadge size={22} />, label: 'MÃ SỐ SINH VIÊN', value: data?.MSSV },
    { icon: <MdPerson size={22} />, label: 'HỌ VÀ TÊN', value: data?.HoTen },
    { icon: <MdSchool size={22} />, label: 'NGÀNH HỌC', value: data?.Nganh || '—' },
    { icon: <MdBusiness size={22} />, label: 'TRỰC THUỘC KHOA', value: data?.TenKhoa || '—' },
  ]

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Injecting CSS styles directly for hover and active effects */}
      <style>{`
        .info-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          overflow: hidden;
          position: relative;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .info-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(37,99,235,0) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(37, 99, 235, 0.15);
          border-color: #bfdbfe;
        }
        .info-card:hover::before {
          opacity: 1;
        }
        .info-card:active {
          transform: translateY(-1px);
        }
        .profile-card {
          background: linear-gradient(160deg, #1e3a5f 0%, #0f172a 100%);
          border-radius: 24px;
          padding: 40px 24px 32px;
          color: #fff;
          text-align: center;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.4);
          position: relative;
          overflow: hidden;
        }
        .profile-card::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%);
          transform: rotate(30deg);
          pointer-events: none;
        }
        .avatar-container {
          width: 96px; height: 96px; 
          background: rgba(255,255,255,0.1); 
          backdrop-filter: blur(10px);
          border-radius: 28px;
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; font-weight: 900; margin: 0 auto 24px; 
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          z-index: 2;
        }
        .avatar-container:hover {
          transform: scale(1.08) rotate(5deg);
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.15);
        }
        .risk-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        .risk-card:hover {
          box-shadow: 0 20px 40px -15px rgba(37,99,235,0.1);
          border-color: #cbd5e1;
        }
        .icon-box {
          width: 52px; height: 52px;
          background: #f0f4fa;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          color: #1e3a5f;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .info-card:hover .icon-box {
          background: #1e3a5f;
          color: #ffffff;
          transform: scale(1.05);
        }
      `}</style>

      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b' }}>Thông tin cá nhân</h1>
        <p style={{ color: '#64748b' }}>Hồ sơ định danh của bạn trong hệ thống</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Left Column: Profile Card & Notice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="profile-card">
            <div className="avatar-container">
              {initials}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>{data?.HoTen}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 24, fontWeight: 500 }}>
              Sinh viên — {data?.TenKhoa}
            </div>

            <div style={{ 
              borderTop: '1px solid rgba(255,255,255,0.15)', 
              paddingTop: 20, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, fontSize: 11, fontWeight: 600 }}>TRẠNG THÁI</span>
                <span style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                }}>
                  Đang học
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, fontSize: 11, fontWeight: 600 }}>NIÊN KHÓA</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>2023 — 2027</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', 
            borderRadius: 16, padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <MdShield color="#2563eb" size={18} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Early warning system</span>
            </div>
            <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, margin: 0 }}>
              Thông tin định danh được mã hóa và bảo mật toàn diện. Mọi thay đổi dữ liệu yêu cầu xác thực từ phòng đào tạo.
            </p>
          </div>
        </div>

        {/* Right Column: Info Cards Component & Risk Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {infoItems.map((item, index) => (
              <div key={item.label} className="info-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="icon-box">
                  {item.icon}
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 6 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {riskData && (
            <div className="risk-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 8, height: 24, background: '#2563eb', borderRadius: 4 }}></div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Tổng quan chỉ số rủi ro</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <div style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', transform: 'scale(1.05)' }}>
                  <CircularGauge percent={riskPct} size={130} />
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Tỷ lệ chuyên cần</span>
                      <span style={{ fontWeight: 800, color: '#1e293b' }}>{attendancePct}%</span>
                    </div>
                    <div style={{ height: 10, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${attendancePct}%`, 
                        background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: 10,
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Điểm trung bình hệ 4.0</span>
                      <span style={{ fontWeight: 800, color: '#1e293b' }}>{gpa} / 4.0</span>
                    </div>
                    <div style={{ height: 10, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(parseFloat(gpa)/4)*100}%`, 
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                        borderRadius: 10,
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                  * Dữ liệu AI phân tích được đồng bộ từ hệ thống đào tạo.
                </p>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', padding: '4px 12px', borderRadius: 12 }}>
                  Cập nhật hôm nay
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
