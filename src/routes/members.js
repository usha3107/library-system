// src/routes/members.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /members
router.post('/', (req, res) => {
  const { name, email, membership_number } = req.body;
  if (!name || !email || !membership_number) {
    return res.status(400).json({ error: 'name, email, membership_number required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO members (name, email, membership_number, status)
      VALUES (?, ?, ?, 'active')
    `);
    const info = stmt.run(name, email, membership_number);
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Could not create member (maybe duplicate email/membership_number)' });
  }
});

// GET /members
router.get('/', (req, res) => {
  const members = db.prepare('SELECT * FROM members').all();
  res.json(members);
});

// GET /members/:id
router.get('/:id', (req, res) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

// PUT /members/:id
router.put('/:id', (req, res) => {
  const { name, email, membership_number, status } = req.body;
  const id = req.params.id;

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  db.prepare(`
    UPDATE members
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        membership_number = COALESCE(?, membership_number),
        status = COALESCE(?, status)
    WHERE id = ?
  `).run(name, email, membership_number, status, id);

  const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /members/:id
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Member not found' });
  res.status(204).send();
});

// GET /members/:id/borrowed
router.get('/:id/borrowed', (req, res) => {
  const memberId = req.params.id;

  const rows = db.prepare(`
    SELECT t.*, b.title, b.author
    FROM transactions t
    JOIN books b ON b.id = t.book_id
    WHERE t.member_id = ?
      AND t.returned_at IS NULL
  `).all(memberId);

  res.json(rows);
});

module.exports = router;
