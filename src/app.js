// src/app.js
const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Import routers
const bookRoutes = require('./routes/books');
const memberRoutes = require('./routes/members');
const transactionRoutes = require('./routes/transactions');
const fineRoutes = require('./routes/fines');

// Health check
app.get('/', (req, res) => {
  res.json({ message: '📚 Library API running' });
});

// Mount routes
app.use('/books', bookRoutes);
app.use('/members', memberRoutes);
app.use('/transactions', transactionRoutes);
app.use('/fines', fineRoutes);

module.exports = app;
