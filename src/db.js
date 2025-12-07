// src/db.js
const path = require('path');
const Database = require('better-sqlite3');

// DB file in project root: library.db
const dbPath = path.join(__dirname, '..', 'library.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

module.exports = db;
