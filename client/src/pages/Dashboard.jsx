import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('smartquiz_user') || 'null');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Refresh user stats from server
    if (user?.phone) {
      api.post('/auth/login', { phone: user.phone }).then(r => {
        localStorage.setItem('smartquiz_user', JSON.stringify(r.data.user));
      }).catch(() => {});
    }
    api.get('/classes').then(r => {
      setClasses(r.data);
      setLoading(false);
    });
  // eslint-disable-next-line
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Salom, {user?.name}! 👋</h1>
        <p>Qaysi sinfni test qilmoqchisiz?</p>
      </div>

      <div className="user-stat-bar">
        <div className="user-stat">
          <div className="user-stat-value">{user?.total_tests || 0}</div>
          <div className="user-stat-label">Testlar</div>
        </div>
        <div className="user-stat">
          <div className="user-stat-value">{user?.total_score || 0}</div>
          <div className="user-stat-label">Umumiy ball</div>
        </div>
        <div className="user-stat">
          <div className="user-stat-value">{user?.rating ? user.rating.toFixed(1) : '0.0'}%</div>
          <div className="user-stat-label">Reyting</div>
        </div>
        <div className="user-stat">
          <div className="user-stat-value">{user?.class_id ? classes.find(c => c.id === user.class_id)?.name || '–' : '–'}</div>
          <div className="user-stat-label">Sinf</div>
        </div>
      </div>

      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#4a5568' }}>Sinfni tanlang</h2>
      </div>

      <div className="card-grid">
        {classes.map(cls => {
          const num = cls.name.replace('-sinf', '');
          return (
            <Link key={cls.id} to={`/subjects/${cls.id}`} className="class-card">
              <div className="class-card-number">{num}</div>
              <div className="class-card-label">{cls.name}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
