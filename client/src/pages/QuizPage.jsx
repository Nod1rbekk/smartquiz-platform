import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const TIMER_SECONDS = 30;
const LABELS = ['A', 'B', 'C', 'D'];

export default function QuizPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('smartquiz_user') || 'null');

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
  const [selected, setSelected] = useState(null);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [tabAlert, setTabAlert] = useState(false);
  const timerRef = useRef(null);
  const subjectNameRef = useRef('');

  // Anti-cheat: tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setTabWarnings(prev => {
          const next = prev + 1;
          setTabAlert(true);
          setTimeout(() => setTabAlert(false), 3000);
          if (next >= 3) {
            // Auto-submit
            submitQuiz(true);
          }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  // eslint-disable-next-line
  }, []);

  useEffect(() => {
    api.get(`/quiz/questions/${subjectId}`).then(r => {
      setQuestions(r.data);
      setLoading(false);
    }).catch(() => navigate('/dashboard'));
    // Get subject name for display
    api.get('/subjects').then(r => {
      const sub = r.data.find(s => s.id === parseInt(subjectId));
      if (sub) subjectNameRef.current = sub.name;
    });
  }, [subjectId, navigate]);

  const goNext = useCallback(() => {
    setCurrent(prev => prev + 1);
    setSelected(null);
    setTimer(TIMER_SECONDS);
  }, []);

  // Timer
  useEffect(() => {
    if (loading || submitting) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time up: mark as unanswered (-1) and move on
          if (current < questions.length - 1) {
            goNext();
          } else {
            submitQuiz();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line
  }, [current, loading, submitting, questions.length]);

  const selectOption = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const q = questions[current];
    setAnswers(prev => ({ ...prev, [q.id]: idx }));
  };

  const handleNext = () => {
    clearInterval(timerRef.current);
    if (current < questions.length - 1) {
      goNext();
    } else {
      setShowConfirm(true);
    }
  };

  const submitQuiz = async (autoSubmit = false) => {
    clearInterval(timerRef.current);
    if (!autoSubmit) setShowConfirm(false);
    setSubmitting(true);

    const answerList = questions.map(q => ({
      question_id: q.id,
      selected_index: answers[q.id] !== undefined ? answers[q.id] : -1,
      correct_index: q.correct_index,  // shuffled correct_index from server
      options: [q.option_a, q.option_b, q.option_c, q.option_d]  // shuffled options
    }));

    try {
      const { data } = await api.post('/quiz/submit', {
        user_id: user.id,
        subject_id: parseInt(subjectId),
        answers: answerList
      });
      // Update user in localStorage
      const updatedUser = { ...user, total_tests: (user.total_tests || 0) + 1 };
      localStorage.setItem('smartquiz_user', JSON.stringify(updatedUser));
      navigate(`/result/${data.result_id}`, { state: { result: data } });
    } catch {
      navigate('/dashboard');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (questions.length === 0) return (
    <div className="container">
      <div className="empty-state">
        <div style={{ fontSize: '3rem' }}>📭</div>
        <p>Bu mavzu uchun savollar yo'q</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>Orqaga</button>
      </div>
    </div>
  );

  const q = questions[current];
  const timerClass = timer > 15 ? 'timer-green' : timer > 7 ? 'timer-yellow' : 'timer-red';
  const progress = ((current) / questions.length) * 100;

  return (
    <div className="quiz-page">
      {tabAlert && (
        <div className="anticheat-warning">
          ⚠️ Tab almashtirish aniqlandi! ({tabWarnings}/3) – 3 martadan keyin test avtomatik tugaydi
        </div>
      )}

      <div className="quiz-progress-bar">
        <div className="quiz-progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-header">
        <div className="quiz-progress-text">
          Savol {current + 1} / {questions.length}
        </div>
        <div className={`quiz-timer ${timerClass}`}>{timer}</div>
      </div>

      <div className="quiz-question">{q.question_text}</div>

      <div className="quiz-options">
        {[q.option_a, q.option_b, q.option_c, q.option_d].map((opt, idx) => (
          <button
            key={idx}
            className={`quiz-option${selected === idx ? ' selected' : ''}`}
            onClick={() => selectOption(idx)}
            disabled={selected !== null}
          >
            <span className="option-label">{LABELS[idx]}</span>
            {opt}
          </button>
        ))}
      </div>

      <div className="quiz-nav">
        {selected !== null && (
          <button className="btn btn-primary" onClick={handleNext}>
            {current < questions.length - 1 ? 'Keyingi →' : 'Yakunlash'}
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="quiz-confirm-overlay">
          <div className="quiz-confirm-box">
            <h3>Testni yakunlaysizmi?</h3>
            <p>
              Javob berilgan: {Object.keys(answers).length}/{questions.length}<br />
              Javob berilmagan: {questions.length - Object.keys(answers).length} ta savol
            </p>
            <div className="btn-row">
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Bekor</button>
              <button className="btn btn-success" onClick={() => submitQuiz()}>Yakunlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
