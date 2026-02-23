const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// Register (student only)
router.post('/register', async (req, res) => {
  const { name, phone, class_id } = req.body;
  if (!name || !phone || !class_id) {
    return res.status(400).json({ error: 'Ism, telefon va sinf talab qilinadi' });
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' });
  }

  const { data, error } = await supabase
    .from('users')
    .insert({ name, phone, class_id, role: 'student' })
    .select('id, name, phone, username, class_id, role, total_score, total_tests, rating')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

// Login by phone (students)
router.post('/login', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Telefon raqam talab qilinadi' });

  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone, username, class_id, role, total_score, total_tests, rating')
    .eq('phone', phone)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  res.json({ user: data });
});

// Admin login by username + password
router.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Login va parol talab qilinadi' });
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone, username, class_id, role, total_score, total_tests, rating, password')
    .eq('username', username)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  if (data.password !== password) return res.status(401).json({ error: 'Parol noto\'g\'ri' });
  if (data.role !== 'admin') return res.status(403).json({ error: 'Faqat adminlar kirishi mumkin' });

  // Don't send password back
  const { password: _, ...user } = data;
  res.json({ user });
});

module.exports = router;
