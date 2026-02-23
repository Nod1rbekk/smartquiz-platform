import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import SubjectPage from './pages/SubjectPage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProgressPage from './pages/ProgressPage';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';

function PrivateRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('smartquiz_user') || 'null');
  return user ? children : <Navigate to="/auth" replace />;
}

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('smartquiz_user') || 'null');
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const user = JSON.parse(localStorage.getItem('smartquiz_user') || 'null');
  return (
    <BrowserRouter>
      {user && <Navbar />}
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/subjects/:classId" element={<PrivateRoute><SubjectPage /></PrivateRoute>} />
        <Route path="/quiz/:subjectId" element={<PrivateRoute><QuizPage /></PrivateRoute>} />
        <Route path="/result/:resultId" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
        <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
        <Route path="/progress" element={<PrivateRoute><ProgressPage /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/auth'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
