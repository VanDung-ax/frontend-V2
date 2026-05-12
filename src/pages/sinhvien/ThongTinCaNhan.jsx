import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getStudent, getAllResults } from '../../services/api';
import { MdPerson, MdSchool, MdBusiness, MdBadge, MdShield, MdWarningAmber } from 'react-icons/md';

function CleanDonut({ percent, size = 180 }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  
  let color = '#dc2626';
  let label = 'Rủi ro cực cao';
  if (percent < 40) { color = '#16a34a'; label = 'An toàn'; }
  else if (percent < 65) { color = '#f59e0b'; label = 'Cảnh báo'; }
  else if (percent < 80) { color = '#ea580c'; label = 'Rủi ro cao'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="36" fontWeight="800" fill={color}>
          {percent.toFixed(2)}%
        </text>
      </svg>
      <div style={{ marginTop: 16, fontWeight: 700, color: color, fontSize: 16 }}>{label}</div>
    </div>
  );
}

export default function ThongTinCaNhan() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const mssv = user?.linked_id;
        if (!mssv) { setError('Không tìm thấy MSSV liên kết.'); setLoading(false); return; }
        const [svRes, riskRes] = await Promise.all([
          getStudent(mssv),
          getAllResults(user?.id, 'khoa').catch(() => ({ data: [] }))
        ]);
        setData(svRes.data);
        
        const raw = riskRes.data || [];
        const mine = raw.filter(r => String(r.MSSV) === String(mssv));
        if (mine.length > 0) {
          const latest = mine.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
          setRiskData(latest);
        }
      } catch (err) { setError('Lỗi tải thông tin sinh viên từ máy chủ.'); }
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;
  if (error) return <div style={{ padding: 40, color: '#dc2626' }}>{error}</div>;

  const riskPct = riskData ? (riskData.risk_score || 0) * 100 : 0;
  const attendancePct = riskData ? (parseFloat(riskData.chuyen_can) || 0) : 0;

  const infoItems = [
    { icon: <MdBadge size={24} />, label: 'Mã số sinh viên', value: data?.MSSV },
    { icon: <MdPerson size={24} />, label: 'Họ và tên', value: data?.HoTen },
    { icon: <MdSchool size={24} />, label: 'Chuyên ngành', value: data?.Nganh || '—' },
    { icon: <MdBusiness size={24} />, label: 'Khoa', value: data?.TenKhoa || '—' },
  ];

  return (
    <div style={{ paddingBottom: 40, maxWidth: 1200, margin: '0 auto' }}>
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>Hồ sơ sinh viên</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Quản lý thông tin cá nhân và xem đánh giá rủi ro học tập.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {infoItems.map((item, index) => (
              <div key={item.label} className="uni-card" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, background: '#eff6ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="uni-card" style={{ padding: 24, background: '#f8fafc', borderLeft: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 700, color: '#2563eb' }}>
              <MdShield size={20} /> Bảo mật thông tin
            </div>
            <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
              Dữ liệu sinh viên được đồng bộ từ hệ thống quản lý của trường. Nếu có sai sót, vui lòng liên hệ Phòng Đào Tạo để được hỗ trợ cập nhật.
            </p>
          </div>

        </div>

        {/* Right Column (Risk) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Risk Card */}
          <div className="uni-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Chỉ số rủi ro (AI)</span>
              <MdWarningAmber size={24} color="#fca5a5" />
            </div>
            
            {riskData ? (
              <>
                <CleanDonut percent={riskPct} size={200} />
                
                <div style={{ marginTop: 32, textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
                  <div style={{ marginBottom: 16 }}>
                    <div className="uni-progress-header">
                      <span>Tỉ lệ chuyên cần</span>
                      <span style={{ color: '#2563eb' }}>{attendancePct}%</span>
                    </div>
                    <div className="uni-progress-bar-bg">
                      <div className="uni-progress-bar-fill" style={{ width: `${attendancePct}%` }}></div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: '40px 0', color: '#64748b' }}>Chưa có dữ liệu dự báo.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
