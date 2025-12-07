// src/routes/books.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /books
router.post('/', (req, res) => {
  const { isbn, title, author, category, total_copies } = req.body;

  if (!isbn || !title || !author || !total_copies) {
    return res.status(400).json({ error: 'isbn, title, author, total_copies are required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO books (isbn, title, author, category, status, total_copies, available_copies)
      VALUES (?, ?, ?, ?, 'available', ?, ?)
    `);
    const info = stmt.run(isbn, title, author, category || null, total_copies, total_copies);

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(book);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Could not create book (maybe duplicate ISBN)' });
  }
});

// GET /books
router.get('/', (req, res) => {
  const books = db.prepare('SELECT * FROM books').all();
  res.json(books);
});

// GET /books/available
router.get('/available', (req, res) => {
  const books = db.prepare(`
    SELECT * FROM books
    WHERE status = 'available' AND available_copies > 0
  `).all();
  res.json(books);
});

// GET /books/:id
router.get('/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

// PUT /books/:id
router.put('/:id', (req, res) => {
  const { title, author, category, status, total_copies, available_copies } = req.body;
  const id = req.params.id;

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  db.prepare(`
    UPDATE books
    SET title = COALESCE(?, title),
        author = COALESCE(?, author),
        category = COALESCE(?, category),
        status = COALESCE(?, status),
        total_copies = COALESCE(?, total_copies),
        available_copies = COALESCE(?, available_copies)
    WHERE id = ?
  `).run(title, author, category, status, total_copies, available_copies, id);

  const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /books/:id
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Book not found' });
  res.status(204).send();
});

module.exports = router;
