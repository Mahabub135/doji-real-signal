const allowedSymbols = new Set(['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','USD/CHF','NZD/USD']);
async function getCandles(symbol = 'EUR/USD', interval = '1min') {
  if (!allowedSymbols.has(symbol)) throw new Error('Unsupported symbol. OTC symbols are not verified by this feed.');
  if (!process.env.MARKET_DATA_API_KEY) throw new Error('MARKET_DATA_API_KEY is not configured.');
  const base = (process.env.MARKET_DATA_BASE_URL || 'https://api.twelvedata.com').replace(/\/$/, '');
  const url = new URL(`${base}/time_series`);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('outputsize', '100');
  url.searchParams.set('apikey', process.env.MARKET_DATA_API_KEY);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Market provider HTTP ${response.status}`);
  const data = await response.json();
  if (data.status === 'error' || !Array.isArray(data.values)) throw new Error(data.message || 'Market provider returned no candles.');
  const candles = data.values.map(c => ({
    datetime: c.datetime, open: Number(c.open), high: Number(c.high),
    low: Number(c.low), close: Number(c.close)
  })).reverse();
  return candles;
}
module.exports = { getCandles, allowedSymbols };
