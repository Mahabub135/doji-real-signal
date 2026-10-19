require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const api = require('./src/routes');
const { initDb } = require('./src/db');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', api);

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const port = Number(process.env.PORT || 3000);
initDb().then(() => app.listen(port, () => {
  console.log(`Signal dashboard running on http://localhost:${port}`);
})).catch(err => {
  console.error('Database startup failed:', err.message);
  process.exit(1);
});
