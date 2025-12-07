// src/migrations.js
const db = require('./db');

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT,
      status TEXT NOT NULL CHECK(status IN ('available','borrowed','reserved','maintenance')) DEFAULT 'available',
      total_copies INTEGER NOT NULL,
      available_copies INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      membership_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL CHECK(status IN ('active','suspended')) DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      borrowed_at TEXT NOT NULL,
      due_date TEXT NOT NULL,
      returned_at TEXT,
      status TEXT NOT NULL CHECK(status IN ('active','returned','overdue')) DEFAULT 'active',
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS fines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      transaction_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      paid_at TEXT,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );
  `);

  console.log('✅ Migrations completed');
}

runMigrations();
