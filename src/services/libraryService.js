// src/services/libraryService.js
const db = require('../db');
const dayjs = require('dayjs');

const DAILY_FINE = 0.5;
const LOAN_DAYS = 14;
const MAX_BORROWED = 3;

function getActiveBorrowedCount(memberId) {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM transactions
    WHERE member_id = ?
      AND returned_at IS NULL
  `).get(memberId);
  return row.count;
}

function hasUnpaidFines(memberId) {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM fines
    WHERE member_id = ?
      AND paid_at IS NULL
  `).get(memberId);
  return row.count > 0;
}

// set status = 'suspended' if >= 3 active overdue books, else 'active'
function updateMemberStatus(memberId) {
  const now = dayjs().toISOString();
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM transactions
    WHERE member_id = ?
      AND returned_at IS NULL
      AND due_date < ?
  `).get(memberId, now);

  const overdueActive = row.count;
  const status = overdueActive >= 3 ? 'suspended' : 'active';

  db.prepare(`UPDATE members SET status = ? WHERE id = ?`).run(status, memberId);
}

function calculateFine(dueDate, returnedAt) {
  const due = dayjs(dueDate);
  const ret = dayjs(returnedAt);
  const diffDays = ret.diff(due, 'day'); // whole days
  if (diffDays <= 0) return 0;
  return diffDays * DAILY_FINE;
}

module.exports = {
  DAILY_FINE,
  LOAN_DAYS,
  MAX_BORROWED,
  getActiveBorrowedCount,
  hasUnpaidFines,
  updateMemberStatus,
  calculateFine,
};
