CREATE TABLE IF NOT EXISTS signals (
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
);
CREATE INDEX IF NOT EXISTS signals_created_at_idx ON signals(created_at DESC);
CREATE INDEX IF NOT EXISTS signals_symbol_idx ON signals(symbol);
