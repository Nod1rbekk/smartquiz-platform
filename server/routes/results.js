const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// Get user progress — must be before /:result_id
router.get('/progress/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { data, error } = await supabase
    .from('user_progress')
    .select('*, subjects(name)')
    .eq('user_id', user_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get user results history
router.get('/user/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { data, error } = await supabase
    .from('results')
    .select('*, subjects(name)')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get detailed result by result_id
router.get('/:result_id', async (req, res) => {
  const { result_id } = req.params;
  const { data: result, error } = await supabase
    .from('results')
    .select('*, subjects(name)')
    .eq('id', result_id)
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const { data: answers } = await supabase
    .from('answers')
    .select('*, questions(question_text, option_a, option_b, option_c, option_d, correct_index, explanation)')
    .eq('result_id', result_id);

  // Use shuffled options/correct_index if saved, otherwise DB originals
  const detailedAnswers = (answers || []).map(a => ({
    ...a,
    display_options: a.shuffled_options || [
      a.questions?.option_a, a.questions?.option_b,
      a.questions?.option_c, a.questions?.option_d
    ],
    display_correct_index: a.shuffled_correct_index ?? a.questions?.correct_index
  }));

  res.json({ ...result, answers: detailedAnswers });
});

module.exports = router;
