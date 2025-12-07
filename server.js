// server.js
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`📚 Library API server running on port ${PORT}`);
});
