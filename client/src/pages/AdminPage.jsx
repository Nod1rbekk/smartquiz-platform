import { useEffect, useState, useRef } from 'react';
import api from '../api';

const EMPTY_QUESTION = () => ({
  question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_index: 0, explanation: '', difficulty: 'medium'
});

export default function AdminPage() {
  const [tab, setTab] = useState('add');
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const [uploadClass, setUploadClass] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');

  // Add questions state
  const [selectedClass, setSelectedClass] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [questions, setQuestions] = useState([EMPTY_QUESTION()]);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadStats = () => api.get('/admin/stats').then(r => setStats(r.data));
  const loadSubjects = () => api.get('/admin/subjects').then(r => setSubjects(r.data));
  const loadClasses = () => api.get('/admin/classes').then(r => setClasses(r.data));

  useEffect(() => {
    loadStats();
    loadSubjects();
    loadClasses();
  }, []);

  // --- Question editor helpers ---
  const updateQ = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const addQuestion = () => setQuestions(prev => [...prev, EMPTY_QUESTION()]);

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQuestions = async () => {
    if (!selectedClass) return setSaveError('Sinf tanlang');
    if (!subjectName.trim()) return setSaveError('Mavzu nomini kiriting');
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d)
        return setSaveError(`${i + 1}-savol: barcha maydonlarni to'ldiring`);
    }
    setSaving(true);
    setSaveError(null);
    setSaveResult(null);
    try {
      const { data } = await api.post('/admin/questions', {
        class_id: parseInt(selectedClass),
        subject_name: subjectName.trim(),
        questions
      });
      setSaveResult(`${data.inserted} ta savol muvaffaqiyatli saqlandi!`);
      setSelectedClass('');
      setSubjectName('');
      setQuestions([EMPTY_QUESTION()]);
      loadStats();
      loadSubjects();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  // --- Excel upload helpers ---
  const downloadTemplate = () => window.open('/api/admin/template', '_blank');

  const handleFile = async (file) => {
    if (!file) return;
    if (!uploadClass) return setUploadError({ error: 'Avval sinf tanlang' });
    if (!uploadSubject.trim()) return setUploadError({ error: 'Avval mavzu nomini kiriting' });
    setUploadResult(null);
    setUploadError(null);
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('class_id', uploadClass);
    form.append('subject_name', uploadSubject.trim());
    try {
      const { data } = await api.post('/admin/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadResult(data);
      setUploadClass('');
      setUploadSubject('');
      if (fileRef.current) fileRef.current.value = '';
      loadStats();
      loadSubjects();
    } catch (err) {
      setUploadError(err.response?.data || { error: 'Xatolik yuz berdi' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDelete = async (id) => {
    await api.delete(`/admin/subjects/${id}`);
    setDeleteConfirm(null);
    loadSubjects();
    loadStats();
  };

  const CORRECT_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin panel</h1>
        <p>Platformani boshqarish</p>
      </div>

      <div className="admin-tabs">
        {[
          { key: 'add', label: 'Test qo\'shish' },
          { key: 'stats', label: 'Statistika' },
          { key: 'upload', label: 'Excel yuklash' },
          { key: 'subjects', label: 'Mavzular' },
        ].map(t => (
          <button key={t.key} className={`admin-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ADD QUESTIONS */}
      {tab === 'add' && (
        <div style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#2d3748' }}>
            Yangi test qo'shish
          </h2>

          {/* Sinf + Mavzu */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Sinf</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                style={inputStyle}
              >
                <option value="">— Sinf tanlang —</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mavzu nomi</label>
              <input
                style={inputStyle}
                placeholder="masalan: Algebra, Fizika, Ingliz tili..."
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
              />
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, idx) => (
            <div key={idx} style={questionCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, color: '#4a5568' }}>{idx + 1}-savol</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={q.difficulty}
                    onChange={e => updateQ(idx, 'difficulty', e.target.value)}
                    style={{ ...inputStyle, width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
                  >
                    <option value="easy">Oson</option>
                    <option value="medium">O'rta</option>
                    <option value="hard">Qiyin</option>
                  </select>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(idx)} style={deleteBtnStyle}>X</button>
                  )}
                </div>
              </div>

              <textarea
                placeholder="Savol matni..."
                value={q.question_text}
                onChange={e => updateQ(idx, 'question_text', e.target.value)}
                style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, oi) => (
                  <div key={opt} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                      onClick={() => updateQ(idx, 'correct_index', oi)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                        background: q.correct_index === oi ? '#48bb78' : '#e2e8f0',
                        color: q.correct_index === oi ? '#fff' : '#4a5568',
                      }}
                      title="To'g'ri javob sifatida belgilash"
                    >
                      {CORRECT_LABELS[oi]}
                    </button>
                    <input
                      placeholder={`${CORRECT_LABELS[oi]} variant`}
                      value={q[opt]}
                      onChange={e => updateQ(idx, opt, e.target.value)}
                      style={{ ...inputStyle, marginBottom: 0 }}
                    />
                  </div>
                ))}
              </div>

              <input
                placeholder="Izoh (ixtiyoriy) — to'g'ri javob tushuntirmasi"
                value={q.explanation}
                onChange={e => updateQ(idx, 'explanation', e.target.value)}
                style={{ ...inputStyle, marginTop: '0.5rem', fontSize: '0.85rem' }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={addQuestion}>
              + Savol qo'shish
            </button>
            <button className="btn btn-primary" onClick={handleSaveQuestions} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>

          {saveResult && (
            <div className="alert alert-success" style={{ marginTop: '1rem' }}>
              {saveResult}
            </div>
          )}
          {saveError && (
            <div className="alert alert-error" style={{ marginTop: '1rem' }}>
              {saveError}
            </div>
          )}
        </div>
      )}

      {/* STATISTICS */}
      {tab === 'stats' && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_students}</div>
            <div className="stat-label">O'quvchilar</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_questions}</div>
            <div className="stat-label">Savollar</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_tests_taken}</div>
            <div className="stat-label">Testlar ishlangan</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_subjects}</div>
            <div className="stat-label">Mavzular</div>
          </div>
        </div>
      )}

        {/* EXCEL UPLOAD */}
        {tab === 'upload' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={downloadTemplate}>
                Excel shablon yuklab olish
              </button>
              <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                Shablon formatida to'ldiring, keyin sinf va mavzu tanlang
              </span>
            </div>

            {/* Sinf + Mavzu for upload */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Sinf</label>
                <select
                  value={uploadClass}
                  onChange={e => setUploadClass(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">— Sinf tanlang —</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Mavzu nomi</label>
                <input
                  style={inputStyle}
                  placeholder="masalan: Algebra, Fizika..."
                  value={uploadSubject}
                  onChange={e => setUploadSubject(e.target.value)}
                />
              </div>
            </div>

            <div
              className={`upload-zone${dragOver ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-icon">📊</div>
              <div className="upload-text">
                {uploading ? 'Yuklanmoqda...' : 'Excel faylni bu yerga tashlang yoki bosing'}
              </div>
              <div className="upload-hint">.xlsx va .xls formatlar qabul qilinadi</div>
            </div>

            {uploadResult && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                {uploadResult.message}
              </div>
            )}
            {uploadError && (
              <div style={{ marginTop: '1rem' }}>
                {uploadError.errors ? (
                  <div className="alert alert-error">
                    <strong>{uploadError.message || 'Xatolar topildi:'}</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                      {uploadError.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                ) : (
                  <div className="alert alert-error">{uploadError.error}</div>
                )}
              </div>
            )}
          </div>
        )}

      {/* SUBJECTS */}
      {tab === 'subjects' && (
        <>
          {subjects.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3rem' }}>📚</div>
              <p>Hali mavzular yo'q. Test qo'shing yoki Excel yuklang.</p>
            </div>
          ) : (
            <table className="subjects-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sinf</th>
                  <th>Mavzu</th>
                  <th>Savollar</th>
                  <th>Amal</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.classes?.name}</td>
                    <td>{s.name}</td>
                    <td><span className="badge badge-medium">{s.question_count} ta</span></td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(s)}>
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="quiz-confirm-overlay">
          <div className="quiz-confirm-box">
            <h3>O'chirishni tasdiqlang</h3>
            <p>"{deleteConfirm.name}" mavzusi va uning barcha savollari o'chiriladi.</p>
            <div className="btn-row">
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Bekor</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.85rem', fontWeight: 600,
  color: '#4a5568', marginBottom: '0.35rem'
};

const inputStyle = {
  width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid #e2e8f0',
  borderRadius: 8, fontSize: '0.9rem', background: '#fff',
  outline: 'none', boxSizing: 'border-box', marginBottom: 0,
  fontFamily: 'inherit', color: '#2d3748',
  transition: 'border-color 0.2s',
};

const questionCardStyle = {
  background: '#f7fafc', border: '1.5px solid #e2e8f0',
  borderRadius: 12, padding: '1rem 1.1rem', marginBottom: '1rem'
};

const deleteBtnStyle = {
  width: 28, height: 28, borderRadius: '50%', border: 'none',
  background: '#fed7d7', color: '#c53030', cursor: 'pointer',
  fontWeight: 700, fontSize: '0.75rem', lineHeight: '1'
};
