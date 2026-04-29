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
  const color = percent >= 65 ? 'var(--cyber-danger)' : percent >= 40 ? 'var(--cyber-warning)' : 'var(--cyber-accent)'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none" stroke="rgba(0, 240, 255, 0.1)" strokeWidth={8}
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
        style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 4px ${color})` }}
      />
      {/* Label */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="900" fill={color} style={{ fontFamily: 'var(--font-display)' }}>
        {percent.toFixed(2)}%
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9" fill="var(--cyber-text-muted)" fontWeight="600" letterSpacing="1">
        RISK LEVEL
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
      <div className="spinner" style={{ borderColor: 'var(--cyber-accent)', borderTopColor: 'transparent' }} />
    </div>
  )
  if (error) return <div className="cyber-badge cyber-badge-danger" style={{ padding: 16 }}>{error}</div>

  const initials = data?.HoTen?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || 'SV'
  const riskPct = riskData ? (riskData.risk_score || 0) * 100 : 0
  const attendancePct = riskData ? (parseFloat(riskData.chuyen_can) || 0) : 0
  const gpa = riskData ? ((parseFloat(riskData.diem_qua_trinh) || 0) * 0.4).toFixed(1) : '—'

  const infoItems = [
    { icon: <MdBadge size={22} />, label: 'STUDENT_ID', value: data?.MSSV },
    { icon: <MdPerson size={22} />, label: 'FULL_NAME', value: data?.HoTen },
    { icon: <MdSchool size={22} />, label: 'MAJOR', value: data?.Nganh || '—' },
    { icon: <MdBusiness size={22} />, label: 'DEPARTMENT', value: data?.TenKhoa || '—' },
  ]

  return (
    <div style={{ paddingBottom: 40 }}>
      <style>{`
        .info-card {
          background: var(--cyber-card);
          border-radius: 4px;
          border: 1px solid var(--cyber-border);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
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
          background: linear-gradient(135deg, rgba(0,240,255,0.05) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--cyber-accent-glow);
          border-color: var(--cyber-accent);
        }
        .info-card:hover::before { opacity: 1; }
        .profile-card {
          background: rgba(0, 240, 255, 0.02);
          border: 1px solid var(--cyber-border);
          border-radius: 4px;
          padding: 40px 24px 32px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .avatar-container {
          width: 96px; height: 96px; 
          background: rgba(0, 240, 255, 0.1); 
          backdrop-filter: blur(10px);
          border-radius: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display);
          font-size: 36px; font-weight: 900; margin: 0 auto 24px; 
          border: 1px solid var(--cyber-accent);
          box-shadow: var(--cyber-accent-glow);
          color: var(--cyber-accent);
          transition: transform 0.4s ease;
          position: relative;
          z-index: 2;
        }
        .avatar-container:hover {
          transform: scale(1.05);
          background: rgba(0, 240, 255, 0.2);
        }
        .risk-card {
          background: var(--cyber-card);
          border-radius: 4px;
          padding: 28px;
          border: 1px solid var(--cyber-border);
          transition: all 0.3s ease;
        }
        .risk-card:hover {
          box-shadow: inset 0 0 20px rgba(0, 240, 255, 0.05);
          border-color: var(--cyber-border-glow);
        }
        .icon-box {
          width: 48px; height: 48px;
          background: rgba(0, 240, 255, 0.05);
          border: 1px solid var(--cyber-border);
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          color: var(--cyber-accent);
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .info-card:hover .icon-box {
          background: rgba(0, 240, 255, 0.2);
          box-shadow: var(--cyber-accent-glow);
        }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, color: 'var(--cyber-accent)', textShadow: 'var(--cyber-accent-glow)' }}>USER_PROFILE</h1>
        <p style={{ color: 'var(--cyber-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1 }}>SYSTEM_IDENTITY_RECORD</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Left Column: Profile Card & Notice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="profile-card">
            <div className="avatar-container">
              {initials}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--cyber-text)', marginBottom: 8, letterSpacing: 1 }}>{data?.HoTen}</div>
            <div style={{ fontSize: 11, color: 'var(--cyber-text-muted)', marginBottom: 24, letterSpacing: 1 }}>
              STUDENT // {data?.TenKhoa}
            </div>

            <div style={{ 
              borderTop: '1px solid var(--cyber-border)', 
              paddingTop: 20, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="tech-label">STATUS</span>
                <span className="cyber-badge cyber-badge-success" style={{ boxShadow: 'var(--cyber-success-glow)' }}>
                  ACTIVE
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="tech-label">TERM</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--cyber-text)' }}>2023_2027</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(0, 240, 255, 0.05)', 
            borderRadius: 4, padding: '20px',
            border: '1px solid var(--cyber-border)',
            borderLeft: '4px solid var(--cyber-accent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <MdShield color="var(--cyber-accent)" size={18} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--cyber-accent)', letterSpacing: 1 }}>SECURITY_PROTOCOL</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--cyber-text-muted)', lineHeight: 1.6, margin: 0, letterSpacing: 0.5 }}>
              All identity records are encrypted. Unauthorized modifications are prohibited. Contact ADMINISTRATION for data overrides.
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
                  <div className="tech-label" style={{ marginBottom: 6 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--cyber-text)', letterSpacing: 1 }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {riskData && (
            <div className="risk-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 4, height: 20, background: 'var(--cyber-accent)', boxShadow: 'var(--cyber-accent-glow)' }}></div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--cyber-accent)', letterSpacing: 1 }}>RISK_ANALYSIS_OVERVIEW</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <div>
                  <CircularGauge percent={riskPct} size={130} />
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="tech-label">ATTENDANCE_RATE</span>
                      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--cyber-text)' }}>{attendancePct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${attendancePct}%`, 
                        background: 'var(--cyber-accent)',
                        boxShadow: 'var(--cyber-accent-glow)',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="tech-label">GPA_METRIC [4.0]</span>
                      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--cyber-text)' }}>{gpa}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(parseFloat(gpa)/4)*100}%`, 
                        background: 'var(--cyber-success)',
                        boxShadow: 'var(--cyber-success-glow)',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                marginTop: 32, paddingTop: 16, borderTop: '1px dashed rgba(0, 240, 255, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <p style={{ fontSize: 10, color: 'var(--cyber-text-muted)', fontStyle: 'italic', margin: 0, letterSpacing: 0.5 }}>
                  * DATA SYNCHRONIZED FROM CORE NEURAL NETWORK.
                </p>
                <div className="cyber-badge cyber-badge-success">
                  SYNC_COMPLETE
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
