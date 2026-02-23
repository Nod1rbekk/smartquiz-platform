import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('smartquiz_user') || 'null');

  const logout = () => {
    localStorage.removeItem('smartquiz_user');
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">SmartQuiz</Link>
      <div className="navbar-user">
        <Link to="/leaderboard" className="btn btn-secondary btn-sm">Reyting</Link>
        <Link to="/progress" className="btn btn-secondary btn-sm">Progress</Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className="btn btn-secondary btn-sm">Admin</Link>
        )}
        <span style={{ color: 'white', fontWeight: 600 }}>{user?.name}</span>
        <button onClick={logout} className="btn btn-danger btn-sm">Chiqish</button>
      </div>
    </nav>
  );
}
