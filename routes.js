const express = require('express');
const { pool } = require('./db');
const { analyze } = require('./indicators');
const { getCandles, allowedSymbols } = require('./marketData');
const router = express.Router();

router.get('/health', (_req, res) => res.json({ ok: true, service: 'signal-api', time: new Date().toISOString() }));
router.get('/assets', (_req, res) => res.json([
  ...Array.from(allowedSymbols).map(symbol => ({ symbol, market: 'FOREX', dataStatus: 'provider-required' }))
]));
router.get('/market/candles', async (req, res) => {
  try {
    const candles = await getCandles(String(req.query.symbol || 'EUR/USD'), String(req.query.interval || '1min'));
    res.json({ source: 'configured-market-provider', candles });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
router.get('/signals', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 30), 1), 100);
    const result = await pool.query('SELECT * FROM signals ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: 'Could not load signal history. Check database configuration.' }); }
});
router.post('/signals/scan', async (req, res) => {
  try {
    const symbol = String(req.body.symbol || 'EUR/USD');
    const interval = String(req.body.interval || '1min');
    const candles = await getCandles(symbol, interval);
    const result = analyze(candles);
    const row = {
      symbol, market: 'FOREX', timeframe: interval, ...result,
      entryPrice: candles[candles.length - 1].close
    };
    if (process.env.DATABASE_URL) {
      const saved = await pool.query(
        `INSERT INTO signals(symbol,market,timeframe,direction,confidence,entry_price,rsi,macd,ema_fast,ema_slow,source)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [row.symbol,row.market,row.timeframe,row.direction,row.confidence,row.entryPrice,row.rsi,row.macd,row.emaFast,row.emaSlow,'configured-market-provider']
      );
      return res.json({ ...row, saved: saved.rows[0], candleTime: candles[candles.length - 1].datetime });
    }
    res.json({ ...row, saved: false, candleTime: candles[candles.length - 1].datetime, note: 'DATABASE_URL not set; not saved' });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
module.exports = router;
