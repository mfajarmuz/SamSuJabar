const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { asyncHandler } = require('../utils/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('outlets')
    .select('*')
    .eq('aktif', true)
    .order('nama');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

module.exports = router;
