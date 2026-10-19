const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined });

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is missing. API will run only where DB access is not needed.');
    return;
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS signals (
    id BIGSERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    market TEXT NOT NULL DEFAULT 'FOREX',
    timeframe TEXT NOT NULL DEFAULT '1min',
    direction TEXT NOT NULL CHECK (direction IN ('CALL','PUT','NO TRADE')),
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    entry_price NUMERIC,
    rsi NUMERIC,
    macd NUMERIC,
    ema_fast NUMERIC,
    ema_slow NUMERIC,
    status TEXT NOT NULL DEFAULT 'PENDING',
    source TEXT NOT NULL DEFAULT 'market-api',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}
module.exports = { pool, initDb };
