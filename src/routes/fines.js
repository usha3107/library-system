// src/routes/fines.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');
const { updateMemberStatus } = require('../services/libraryService');

// POST /fines/:id/pay
router.post('/:id/pay', (req, res) => {
  const id = req.params.id;
  const fine = db.prepare('SELECT * FROM fines WHERE id = ?').get(id);

  if (!fine) return res.status(404).json({ error: 'Fine not found' });
  if (fine.paid_at) return res.status(400).json({ error: 'Fine already paid' });

  const paid_at = dayjs().toISOString();

  db.prepare(`
    UPDATE fines
    SET paid_at = ?
    WHERE id = ?
  `).run(paid_at, id);

  const updatedFine = db.prepare('SELECT * FROM fines WHERE id = ?').get(id);

  // Re-evaluate member status after paying
  updateMemberStatus(updatedFine.member_id);

  res.json(updatedFine);
});

module.exports = router;
