const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const supabase = require('../supabase');

const upload = multer({ storage: multer.memoryStorage() });

// Download Excel template (sinf/mavzu ustunlarsiz - UI dan tanlanadi)
router.get('/template', (req, res) => {
  const ws_data = [
    ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'explanation', 'difficulty'],
    ['2+2 nechaga teng?', '3', '4', '5', '6', 'B', '2+2=4 bo\'ladi', 'easy'],
    ['Yorug\'lik tezligi necha km/s?', '100 000', '300 000', '150 000', '1 000 000', 'B', 'Yorug\'lik tezligi 300 000 km/s', 'medium'],
    ['O\'zbekiston poytaxti qaysi?', 'Samarqand', 'Toshkent', 'Buxoro', 'Namangan', 'B', 'O\'zbekiston poytaxti Toshkent shahri', 'easy']
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [
    { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 14 }, { wch: 40 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Savollar');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=smartquiz_shablon.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// Upload Excel with questions (class_id and subject_name come from form body)
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fayl yuklanmadi' });
  const { class_id, subject_name } = req.body;
  if (!class_id) return res.status(400).json({ error: 'Sinf tanlanmagan' });
  if (!subject_name || !subject_name.trim()) return res.status(400).json({ error: 'Mavzu nomi kiritilmagan' });

  const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  if (rows.length < 2) return res.status(400).json({ error: 'Fayl bo\'sh' });

  const errors = [];
  const toInsert = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const [questionText, optA, optB, optC, optD, correctOpt, explanation, difficulty] = row;

    if (!questionText || !optA || !optB || !optC || !optD || !correctOpt) {
      errors.push(`Qator ${i + 1}: Majburiy maydonlar (savol, A/B/C/D, to'g'ri javob) to'ldirilmagan`);
      continue;
    }

    const corrUpper = String(correctOpt).trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(corrUpper)) {
      errors.push(`Qator ${i + 1}: correct_option A, B, C yoki D bo'lishi kerak`);
      continue;
    }

    const correctIndex = { A: 0, B: 1, C: 2, D: 3 }[corrUpper];
    const diff = String(difficulty || 'medium').toLowerCase();
    const validDiff = ['easy', 'medium', 'hard'].includes(diff) ? diff : 'medium';

    toInsert.push({
      question_text: String(questionText).trim(),
      option_a: String(optA).trim(),
      option_b: String(optB).trim(),
      option_c: String(optC).trim(),
      option_d: String(optD).trim(),
      correct_index: correctIndex,
      explanation: explanation ? String(explanation).trim() : null,
      difficulty: validDiff
    });
  }

  if (errors.length > 0) return res.status(400).json({ errors });
  if (toInsert.length === 0) return res.status(400).json({ error: 'Yuklanadigan savollar topilmadi' });

  const classIdInt = parseInt(class_id);

  // Get or create subject
  let { data: subjectData } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', subject_name.trim())
    .eq('class_id', classIdInt)
    .single();

  if (!subjectData) {
    const { data: newSubject, error: subErr } = await supabase
      .from('subjects')
      .insert({ name: subject_name.trim(), class_id: classIdInt })
      .select()
      .single();
    if (subErr) return res.status(500).json({ error: 'Mavzu yaratib bo\'lmadi: ' + subErr.message });
    subjectData = newSubject;
  }

  const rows2insert = toInsert.map(item => ({
    class_id: classIdInt,
    subject_id: subjectData.id,
    question_text: item.question_text,
    option_a: item.option_a,
    option_b: item.option_b,
    option_c: item.option_c,
    option_d: item.option_d,
    correct_index: item.correct_index,
    explanation: item.explanation,
    difficulty: item.difficulty
  }));

  const { error: insErr } = await supabase.from('questions').insert(rows2insert);
  if (insErr) return res.status(500).json({ error: insErr.message });

  res.json({ message: `${rows2insert.length} ta savol muvaffaqiyatli yuklandi`, inserted: rows2insert.length });
});

// Statistics
router.get('/stats', async (req, res) => {
  const { data: users } = await supabase.from('users').select('id', { count: 'exact' }).eq('role', 'student');
  const { data: questions } = await supabase.from('questions').select('id', { count: 'exact' });
  const { data: results } = await supabase.from('results').select('id', { count: 'exact' });
  const { data: subjects } = await supabase.from('subjects').select('id', { count: 'exact' });

  const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student');
  const { count: questionCount } = await supabase.from('questions').select('*', { count: 'exact', head: true });
  const { count: resultCount } = await supabase.from('results').select('*', { count: 'exact', head: true });
  const { count: subjectCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });

  res.json({
    total_students: userCount || 0,
    total_questions: questionCount || 0,
    total_tests_taken: resultCount || 0,
    total_subjects: subjectCount || 0
  });
});

// Get all subjects with question counts
router.get('/subjects', async (req, res) => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*, classes(name)');
  if (error) return res.status(500).json({ error: error.message });

  const result = await Promise.all(data.map(async (s) => {
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', s.id);
    return { ...s, question_count: count || 0 };
  }));
  res.json(result);
});

// Delete subject (cascade: answers -> results -> questions -> subject)
router.delete('/subjects/:id', async (req, res) => {
  const subjectId = req.params.id;

  // Get all question IDs for this subject
  const { data: qs } = await supabase
    .from('questions')
    .select('id')
    .eq('subject_id', subjectId);
  const questionIds = (qs || []).map(q => q.id);

  // Get all result IDs for this subject
  const { data: rs } = await supabase
    .from('results')
    .select('id')
    .eq('subject_id', subjectId);
  const resultIds = (rs || []).map(r => r.id);

  // Delete answers linked to those results or questions
  if (resultIds.length > 0) {
    await supabase.from('answers').delete().in('result_id', resultIds);
  }

  // Delete results for this subject
  await supabase.from('results').delete().eq('subject_id', subjectId);

  // Delete user_progress for this subject
  await supabase.from('user_progress').delete().eq('subject_id', subjectId);

  // Delete questions
  await supabase.from('questions').delete().eq('subject_id', subjectId);

  // Delete subject
  const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

// Add questions manually (create subject if not exists, then insert questions)
router.post('/questions', async (req, res) => {
  const { class_id, subject_name, questions } = req.body;
  if (!class_id || !subject_name || !questions || !questions.length) {
    return res.status(400).json({ error: 'Majburiy maydonlar to\'ldirilmagan' });
  }

  // Get or create subject
  let { data: subjectData } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', subject_name.trim())
    .eq('class_id', class_id)
    .single();

  if (!subjectData) {
    const { data: newSubject, error: subErr } = await supabase
      .from('subjects')
      .insert({ name: subject_name.trim(), class_id })
      .select()
      .single();
    if (subErr) return res.status(500).json({ error: subErr.message });
    subjectData = newSubject;
  }

  const rows = questions.map(q => ({
    class_id,
    subject_id: subjectData.id,
    question_text: q.question_text.trim(),
    option_a: q.option_a.trim(),
    option_b: q.option_b.trim(),
    option_c: q.option_c.trim(),
    option_d: q.option_d.trim(),
    correct_index: q.correct_index,
    explanation: q.explanation ? q.explanation.trim() : null,
    difficulty: q.difficulty || 'medium'
  }));

  const { error } = await supabase.from('questions').insert(rows);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, subject_id: subjectData.id, inserted: rows.length });
});

// Get classes (for admin dropdowns)
router.get('/classes', async (req, res) => {
  const { data, error } = await supabase.from('classes').select('*').order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
