// src/routes/transactions.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

const {
  LOAN_DAYS,
  MAX_BORROWED,
  getActiveBorrowedCount,
  hasUnpaidFines,
  updateMemberStatus,
  calculateFine,
} = require('../services/libraryService');

/* BORROW – POST /transactions/borrow */

router.post('/borrow', (req, res) => {
  const { book_id, member_id } = req.body;
  if (!book_id || !member_id) {
    return res.status(400).json({ error: 'book_id and member_id are required' });
  }

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(member_id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  if (member.status === 'suspended') {
    return res.status(403).json({ error: 'Member is suspended' });
  }

  if (hasUnpaidFines(member_id)) {
    return res.status(403).json({ error: 'Member has unpaid fines' });
  }

  const activeCount = getActiveBorrowedCount(member_id);
  if (activeCount >= MAX_BORROWED) {
    return res.status(403).json({ error: 'Borrowing limit reached (3 books)' });
  }

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  if (book.status === 'maintenance') {
    return res.status(400).json({ error: 'Book under maintenance' });
  }

  if (book.available_copies <= 0) {
    return res.status(400).json({ error: 'No copies available' });
  }

  const now = dayjs();
  const borrowed_at = now.toISOString();
  const due_date = now.add(LOAN_DAYS, 'day').toISOString();

  try {
    db.prepare('BEGIN').run();

    const tStmt = db.prepare(`
      INSERT INTO transactions (book_id, member_id, borrowed_at, due_date, status)
      VALUES (?, ?, ?, ?, 'active')
    `);
    const info = tStmt.run(book_id, member_id, borrowed_at, due_date);

    let newAvailable = book.available_copies - 1;
    let newStatus = newAvailable === 0 ? 'borrowed' : book.status;

    db.prepare(`
      UPDATE books
      SET available_copies = ?, status = ?
      WHERE id = ?
    `).run(newAvailable, newStatus, book_id);

    db.prepare('COMMIT').run();

    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: 'Error while borrowing' });
  }
});

/* RETURN – POST /transactions/:id/return */

router.post('/:id/return', (req, res) => {
  const id = req.params.id;

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

  if (transaction.returned_at) {
    return res.status(400).json({ error: 'Book already returned' });
  }

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(transaction.book_id);
  if (!book) return res.status(500).json({ error: 'Book missing for this transaction' });

  const memberId = transaction.member_id;
  const returned_at = dayjs().toISOString();
  const fineAmount = calculateFine(transaction.due_date, returned_at);
  const newStatus = fineAmount > 0 ? 'overdue' : 'returned';

  try {
    db.prepare('BEGIN').run();

    db.prepare(`
      UPDATE transactions
      SET returned_at = ?, status = ?
      WHERE id = ?
    `).run(returned_at, newStatus, id);

    const newAvailable = book.available_copies + 1;
    const bookStatus = 'available';

    db.prepare(`
      UPDATE books
      SET available_copies = ?, status = ?
      WHERE id = ?
    `).run(newAvailable, bookStatus, book.id);

    let fine = null;
    if (fineAmount > 0) {
      const fStmt = db.prepare(`
        INSERT INTO fines (member_id, transaction_id, amount)
        VALUES (?, ?, ?)
      `);
      const info = fStmt.run(memberId, id, fineAmount);
      fine = db.prepare('SELECT * FROM fines WHERE id = ?').get(info.lastInsertRowid);
    }

    updateMemberStatus(memberId);

    db.prepare('COMMIT').run();

    res.json({
      transaction: db.prepare('SELECT * FROM transactions WHERE id = ?').get(id),
      fine,
    });
  } catch (err) {
    console.error(err);
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: 'Error while returning book' });
  }
});

/* OVERDUE – GET /transactions/overdue */

router.get('/overdue', (req, res) => {
  const now = dayjs().toISOString();

  const rows = db.prepare(`
    SELECT t.*, b.title, m.name AS member_name
    FROM transactions t
    JOIN books b ON b.id = t.book_id
    JOIN members m ON m.id = t.member_id
    WHERE t.returned_at IS NULL
      AND t.due_date < ?
  `).all(now);

  res.json(rows);
});

module.exports = router;
