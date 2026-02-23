const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

router.get('/', async (req, res) => {
  const { class_id } = req.query;
  let query = supabase.from('subjects').select('*').order('name');
  if (class_id) query = query.eq('class_id', class_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { name, class_id } = req.body;
  const { data, error } = await supabase.from('subjects').insert({ name, class_id }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
