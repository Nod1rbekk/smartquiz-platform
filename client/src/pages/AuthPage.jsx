import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Student login
  const [loginPhone, setLoginPhone] = useState('');

  // Admin login
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regClass, setRegClass] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('smartquiz_user');
    if (user) {
      const u = JSON.parse(user);
      navigate(u.role === 'admin' ? '/admin' : '/dashboard');
    }
    api.get('/classes').then(r => setClasses(r.data)).catch(() => {});
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { phone: loginPhone });
      localStorage.setItem('smartquiz_user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin-login', {
        username: adminUsername,
        password: adminPassword
      });
      localStorage.setItem('smartquiz_user', JSON.stringify(data.user));
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regClass) return setError('Sinfni tanlang');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: regName,
        phone: regPhone,
        class_id: parseInt(regClass)
      });
      localStorage.setItem('smartquiz_user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">SmartQuiz</div>
        <div className="auth-subtitle">5–11 sinf uchun onlayn test platforma</div>

        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            O'quvchi
          </button>
          <button
            className={`auth-tab${tab === 'admin' ? ' active' : ''}`}
            onClick={() => { setTab('admin'); setError(''); }}
          >
            Admin
          </button>
          <button
            className={`auth-tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Ro'yxat
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Telefon raqam</label>
              <input
                className="form-control"
                type="tel"
                placeholder="+998901234567"
                value={loginPhone}
                onChange={e => setLoginPhone(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Yuklanmoqda...' : 'Kirish'}
            </button>
          </form>
        )}

        {tab === 'admin' && (
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label>Login</label>
              <input
                className="form-control"
                type="text"
                placeholder="admin"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Parol</label>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Yuklanmoqda...' : 'Admin kirish'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Ism va familiya</label>
              <input
                className="form-control"
                type="text"
                placeholder="Ali Valiyev"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefon raqam</label>
              <input
                className="form-control"
                type="tel"
                placeholder="+998901234567"
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Sinf</label>
              <select
                className="form-control"
                value={regClass}
                onChange={e => setRegClass(e.target.value)}
                required
              >
                <option value="">Sinfni tanlang</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Yuklanmoqda...' : 'Ro\'yxatdan o\'tish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
