import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('smartquiz_user') || 'null');
  const [tab, setTab] = useState('global');
  const [globalList, setGlobalList] = useState([]);
  const [classList, setClassList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(user?.class_id || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data));
    api.get('/leaderboard/global').then(r => {
      setGlobalList(r.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (tab === 'class' && selectedClass) {
      setLoading(true);
      api.get(`/leaderboard/class/${selectedClass}`).then(r => {
        setClassList(r.data);
        setLoading(false);
      });
    }
  }, [tab, selectedClass]);

  const list = tab === 'global' ? globalList : classList;

  const getRankClass = (i) => {
    if (i === 0) return 'rank-1';
    if (i === 1) return 'rank-2';
    if (i === 2) return 'rank-3';
    return 'rank-other';
  };

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1>🏆 Reyting jadvali</h1>
        <p>Top o'quvchilar</p>
      </div>

      <div className="leaderboard-tabs">
        <button className={tab === 'global' ? 'active' : ''} onClick={() => { setTab('global'); setLoading(true); api.get('/leaderboard/global').then(r => { setGlobalList(r.data); setLoading(false); }); }}>
          Umumiy Reyting
        </button>
        <button className={tab === 'class' ? 'active' : ''} onClick={() => setTab('class')}>
          Sinf bo'yicha
        </button>
      </div>

      {tab === 'class' && (
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <select className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Sinfni tanlang</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem' }}>📊</div>
          <p>Hali hech kim yo'q</p>
        </div>
      ) : (
        list.map((item, i) => (
          <div key={item.id} className={`leaderboard-item${item.id === user?.id ? ' leaderboard-me' : ''}`}>
            <div className={`leaderboard-rank ${getRankClass(i)}`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </div>
            <div>
              <div className="leaderboard-name">
                {item.name}
                {item.id === user?.id && <span style={{ fontSize: '0.75rem', color: '#667eea', marginLeft: '0.5rem' }}>(Siz)</span>}
              </div>
              <div className="leaderboard-class">{item.classes?.name} · {item.total_tests} ta test</div>
            </div>
            <div>
              <div className="leaderboard-rating">{item.rating ? item.rating.toFixed(1) : '0.0'}%</div>
              <div style={{ fontSize: '0.75rem', color: '#a0aec0', textAlign: 'right' }}>{item.total_score} ball</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
