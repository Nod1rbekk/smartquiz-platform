import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const LABELS = ['A', 'B', 'C', 'D'];

export default function ResultPage() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);

  useEffect(() => {
    if (!location.state?.result) {
      api.get(`/results/${resultId}`).then(r => {
        // Map from DB format to component format
        const data = r.data;
        const detailed = (data.answers || []).map(a => ({
          question_id: a.question_id,
          question_text: a.questions?.question_text,
          options: a.display_options || [a.questions?.option_a, a.questions?.option_b, a.questions?.option_c, a.questions?.option_d],
          selected_index: a.selected_index,
          correct_index: a.display_correct_index ?? a.questions?.correct_index,
          is_correct: a.is_correct,
          explanation: a.questions?.explanation
        }));
        setResult({ result_id: data.id, score: data.score, total_questions: data.total_questions, detailed });
        setLoading(false);
      }).catch(() => navigate('/dashboard'));
    }
  }, [resultId, location.state, navigate]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!result) return null;

  const { score, total_questions, detailed } = result;
  const pct = Math.round((score / total_questions) * 100);
  const incorrect = total_questions - score;

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <div className="result-summary">
        <div className="result-score">{score}/{total_questions}</div>
        <div className="result-score-label">Natija: {pct}%</div>
        <div className="result-stats">
          <div className="result-stat">✅ To'g'ri: {score}</div>
          <div className="result-stat">❌ Xato: {incorrect}</div>
          <div className="result-stat">📊 {pct}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Bosh sahifa
        </button>
        <button className="btn btn-outline" onClick={() => navigate(-2)}>
          Qayta test
        </button>
        <button className="btn btn-secondary" style={{ background: '#667eea', color: 'white' }} onClick={() => navigate('/leaderboard')}>
          Reyting
        </button>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2d3748' }}>
        Savollar tahlili
      </h2>

      {(detailed || []).map((item, i) => (
        <div key={i} className={`answer-item ${item.is_correct ? 'correct' : 'incorrect'}`}>
          <div className="answer-question">
            {i + 1}. {item.question_text}
            <span style={{ marginLeft: '0.5rem' }}>
              {item.is_correct ? '✅' : '❌'}
            </span>
          </div>

          <div className="answer-options">
            {(item.options || []).map((opt, idx) => {
              let cls = 'answer-option';
              if (idx === item.correct_index && idx === item.selected_index) cls += ' user-correct';
              else if (idx === item.correct_index) cls += ' is-correct';
              else if (idx === item.selected_index) cls += ' user-selected';
              return (
                <div key={idx} className={cls}>
                  <strong>{LABELS[idx]}.</strong> {opt}
                  {idx === item.correct_index && ' ✓'}
                  {idx === item.selected_index && idx !== item.correct_index && ' ✗'}
                </div>
              );
            })}
          </div>

          {item.selected_index === -1 && (
            <div className="alert alert-warning" style={{ margin: 0, fontSize: '0.8rem' }}>
              Javob berilmadi (vaqt tugadi)
            </div>
          )}

          {item.explanation && (
            <div className="explanation-box">
              💡 {item.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
