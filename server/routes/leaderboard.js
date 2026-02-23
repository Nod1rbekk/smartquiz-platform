const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// Global top 10
router.get('/global', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, class_id, total_score, total_tests, rating, classes(name)')
    .eq('role', 'student')
    .order('rating', { ascending: false })
    .limit(10);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Top 10 by class
router.get('/class/:class_id', async (req, res) => {
  const { class_id } = req.params;
  const { data, error } = await supabase
    .from('users')
    .select('id, name, class_id, total_score, total_tests, rating, classes(name)')
    .eq('role', 'student')
    .eq('class_id', class_id)
    .order('rating', { ascending: false })
    .limit(10);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
