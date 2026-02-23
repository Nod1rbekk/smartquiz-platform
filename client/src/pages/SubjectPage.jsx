import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function SubjectPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('smartquiz_user') || 'null');
  const [subjects, setSubjects] = useState([]);
  const [progress, setProgress] = useState({});
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/classes'),
      api.get(`/subjects?class_id=${classId}`),
      api.get(`/results/progress/${user.id}`)
    ]).then(([cls, subs, prog]) => {
      const found = cls.data.find(c => c.id === parseInt(classId));
      setClassName(found?.name || '');
      setSubjects(subs.data);
      const progMap = {};
      (prog.data || []).forEach(p => { progMap[p.subject_id] = p; });
      setProgress(progMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [classId, user.id]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const getPctClass = (pct) => {
    if (pct >= 75) return 'progress-green';
    if (pct >= 50) return 'progress-yellow';
    return 'progress-red';
  };

  return (
    <div className="container">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667eea', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          ← Orqaga
        </button>
        <h1>{className} – Mavzular</h1>
        <p>Mavzuni tanlang va test boshlang</p>
      </div>

      {subjects.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem' }}>📚</div>
          <p>Bu sinf uchun mavzular hali qo'shilmagan</p>
        </div>
      ) : (
        <div className="card-grid">
          {subjects.map(sub => {
            const prog = progress[sub.id];
            const pct = prog ? Math.round(prog.percentage) : 0;
            return (
              <Link key={sub.id} to={`/quiz/${sub.id}`} className="subject-card">
                <h3>{sub.name}</h3>
                <div className="subject-progress">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#718096' }}>
                    <span>{prog ? `${prog.total_correct}/${prog.total_attempt}` : 'Yangi'}</span>
                    <span style={{ fontWeight: 700, color: pct >= 75 ? '#38a169' : pct >= 50 ? '#d69e2e' : '#e53e3e' }}>{pct}%</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div
                      className={`progress-bar-fill ${getPctClass(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
