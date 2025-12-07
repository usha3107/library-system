# 📚 Library Management System – RESTful API

---

## 📖 Overview

This project is a **RESTful Library Management System** built using **Node.js**, **Express**, and **SQLite**.  
It manages **Books**, **Members**, **Borrowing Transactions**, and **Fines**, while enforcing complex **business rules** and **state-based logic** similar to a real-world library system.

The system is designed to demonstrate:
- Proper REST API design
- Entity lifecycle management using states
- Business rule enforcement
- Clean and modular backend architecture

---

## 🎯 Objective

To design a backend system that accurately models library workflows such as:
- Borrowing and returning books
- Tracking overdue items
- Applying fines
- Suspending members when rules are violated

---

## 🛠️ Tech Stack

| Layer         | Technology     |
| ------------- | -------------- |
| Runtime       | Node.js        |
| Framework     | Express.js     |
| Database      | SQLite         |
| DB Driver     | better-sqlite3 |
| Date Handling | Day.js         |
| API Testing   | Postman        |

---

## 📁 Project Structure

```text
library-system/
├── server.js
├── library.db
├── package.json
├── README.md
└── src/
    ├── app.js
    ├── db.js
    ├── migrations.js
    ├── services/
    │   └── libraryService.js
    └── routes/
        ├── books.js
        ├── members.js
        ├── transactions.js
        └── fines.js
