import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function ProgressPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('smartquiz_user') || 'null');
  const [progress, setProgress] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/results/progress/${user.id}`),
      api.get(`/results/user/${user.id}`)
    ]).then(([prog, hist]) => {
      setProgress(prog.data || []);
      setHistory(hist.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.id]);

  const getPctColor = (pct) => {
    if (pct >= 75) return '#38a169';
    if (pct >= 50) return '#d69e2e';
    return '#e53e3e';
  };

  const getPctClass = (pct) => {
    if (pct >= 75) return 'progress-green';
    if (pct >= 50) return 'progress-yellow';
    return 'progress-red';
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1>📈 Mening progressim</h1>
        <p>Mavzular bo'yicha natijalar</p>
      </div>

      {progress.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem' }}>🎯</div>
          <p>Hali test ishlamadingiz. Birinchi testni boshlang!</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/dashboard')}>
            Test boshlash
          </button>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: '1.1rem', color: '#4a5568', marginBottom: '1rem' }}>Mavzular bo'yicha</h2>
          {progress.map(p => {
            const pct = Math.round(p.percentage || 0);
            return (
              <div key={p.id} className="progress-subject">
                <div className="progress-subject-header">
                  <span className="progress-subject-name">{p.subjects?.name || 'Mavzu'}</span>
                  <span className="progress-pct" style={{ color: getPctColor(pct) }}>{pct}%</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className={`progress-bar-fill ${getPctClass(pct)}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="progress-meta">
                  ✅ {p.total_correct} to'g'ri / {p.total_attempt} urinish
                </div>
              </div>
            );
          })}

          <h2 style={{ fontSize: '1.1rem', color: '#4a5568', margin: '1.5rem 0 1rem' }}>So'nggi testlar</h2>
          {history.slice(0, 10).map(r => {
            const pct = Math.round((r.score / r.total_questions) * 100);
            const date = new Date(r.created_at).toLocaleDateString('uz-UZ');
            return (
              <div
                key={r.id}
                className="card"
                style={{ marginBottom: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => navigate(`/result/${r.id}`)}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#2d3748' }}>{r.subjects?.name || 'Mavzu'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: getPctColor(pct), fontSize: '1.2rem' }}>{r.score}/{r.total_questions}</div>
                  <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{pct}%</div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
