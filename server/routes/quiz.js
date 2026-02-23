const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// Fisher-Yates shuffle
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get random 10 questions for a subject, with shuffled answer options
router.get('/questions/:subject_id', async (req, res) => {
  const { subject_id } = req.params;
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, correct_index, difficulty')
    .eq('subject_id', subject_id);

  if (error) return res.status(500).json({ error: error.message });

  // Shuffle questions, limit to 10
  const questions = shuffle([...data]).slice(0, 10);

  // For each question, shuffle options and track new correct_index
  const result = questions.map(q => {
    const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
    const correctText = opts[q.correct_index];

    // Create indexed pairs and shuffle
    const indexed = opts.map((text, i) => ({ text, orig: i }));
    shuffle(indexed);

    const newCorrectIndex = indexed.findIndex(o => o.orig === q.correct_index);

    return {
      id: q.id,
      question_text: q.question_text,
      option_a: indexed[0].text,
      option_b: indexed[1].text,
      option_c: indexed[2].text,
      option_d: indexed[3].text,
      correct_index: newCorrectIndex,  // shuffled position
      difficulty: q.difficulty
    };
  });

  res.json(result);
});

// Submit quiz answers
router.post('/submit', async (req, res) => {
  const { user_id, subject_id, answers } = req.body;
  // answers: [{ question_id, selected_index }]

  if (!user_id || !subject_id || !answers?.length) {
    return res.status(400).json({ error: 'Noto\'g\'ri ma\'lumot' });
  }

  // Get correct answers for submitted questions
  const questionIds = answers.map(a => a.question_id);
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, correct_index, explanation, question_text, option_a, option_b, option_c, option_d')
    .in('id', questionIds);

  if (qErr) return res.status(500).json({ error: qErr.message });

  const qMap = {};
  questions.forEach(q => { qMap[q.id] = q; });

  // answers must include correct_index (shuffled) from client
  let score = 0;
  const answerRows = answers.map(a => {
    const correctIdx = a.correct_index !== undefined ? a.correct_index : qMap[a.question_id]?.correct_index;
    const isCorrect = a.selected_index !== -1 && a.selected_index === correctIdx;
    if (isCorrect) score++;
    return {
      question_id: a.question_id,
      selected_index: a.selected_index,
      is_correct: isCorrect,
      shuffled_options: a.options || null,
      shuffled_correct_index: correctIdx
    };
  });

  // Insert result
  const { data: result, error: rErr } = await supabase
    .from('results')
    .insert({ user_id, subject_id, score, total_questions: answers.length })
    .select()
    .single();

  if (rErr) return res.status(500).json({ error: rErr.message });

  // Insert answers
  const answerInserts = answerRows.map(a => ({ ...a, result_id: result.id }));
  await supabase.from('answers').insert(answerInserts);

  // Update user_progress
  const { data: prog } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user_id)
    .eq('subject_id', subject_id)
    .single();

  if (prog) {
    const newAttempt = prog.total_attempt + answers.length;
    const newCorrect = prog.total_correct + score;
    await supabase
      .from('user_progress')
      .update({
        total_attempt: newAttempt,
        total_correct: newCorrect,
        percentage: (newCorrect / newAttempt) * 100
      })
      .eq('id', prog.id);
  } else {
    await supabase.from('user_progress').insert({
      user_id,
      subject_id,
      total_attempt: answers.length,
      total_correct: score,
      percentage: (score / answers.length) * 100
    });
  }

  // Update user stats
  const { data: user } = await supabase.from('users').select('total_score, total_tests').eq('id', user_id).single();
  if (user) {
    const newTotalScore = user.total_score + score;
    const newTotalTests = user.total_tests + 1;
    // Get all results for rating calculation
    const { data: allResults } = await supabase
      .from('results')
      .select('score, total_questions')
      .eq('user_id', user_id);
    let totalCorrect = 0, totalQ = 0;
    (allResults || []).forEach(r => { totalCorrect += r.score; totalQ += r.total_questions; });
    const rating = totalQ > 0 ? (totalCorrect / totalQ) * 100 : 0;
    await supabase.from('users').update({ total_score: newTotalScore, total_tests: newTotalTests, rating }).eq('id', user_id);
  }

  // Build detailed result — use client-sent options/correct_index (shuffled)
  const detailed = answers.map(a => {
    const q = qMap[a.question_id];
    const correctIdx = a.correct_index !== undefined ? a.correct_index : q.correct_index;
    // Use shuffled options if client sent them, else DB order
    const opts = a.options && a.options.length === 4
      ? a.options
      : [q.option_a, q.option_b, q.option_c, q.option_d];
    return {
      question_id: a.question_id,
      question_text: q.question_text,
      options: opts,
      selected_index: a.selected_index,
      correct_index: correctIdx,
      is_correct: a.selected_index !== -1 && a.selected_index === correctIdx,
      explanation: q.explanation
    };
  });

  res.json({ result_id: result.id, score, total_questions: answers.length, detailed });
});

module.exports = router;
