const $ = id => document.getElementById(id);
function fmt(v){return v == null ? '—' : Number(v).toFixed(5)}
async function api(url, options={}) {
  const r = await fetch(url, {headers:{'Content-Type':'application/json'}, ...options});
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}
$('scan').addEventListener('click', async () => {
  const symbol = $('symbol').value;
  $('scan').disabled = true; $('status').textContent = 'Fetching candles and calculating indicators…';
  $('outSymbol').textContent = symbol;
  try {
    const d = await api('/api/signals/scan', {method:'POST',body:JSON.stringify({symbol,interval:'1min'})});
    $('direction').textContent = d.direction;
    $('direction').className = 'direction ' + (d.direction==='CALL'?'call':d.direction==='PUT'?'put':'neutral');
    $('entry').textContent = fmt(d.entryPrice);
    $('confidence').textContent = d.confidence + '/100 (heuristic)';
    $('rsi').textContent = d.indicators?.rsi ?? d.rsi ?? '—'; $('macd').textContent = d.indicators?.macdHistogram ?? d.macd ?? '—';
    $('ema').textContent = `${d.indicators?.ema9 ?? '—'} / ${d.indicators?.ema21 ?? '—'} / ${d.indicators?.ema50 ?? '—'}`;
    $('macd').textContent = d.indicators?.macdHistogram ?? d.macd ?? '—';
    $('stoch').textContent = d.indicators?.stochastic ?? '—'; $('adx').textContent = d.indicators?.adx ?? '—'; $('atr').textContent = d.indicators?.atr ?? '—';
    $('eur').textContent = symbol === 'EUR/USD' ? fmt(d.entryPrice) : '—';
    $('status').textContent = `${d.reason}. Candle: ${d.candleTime || 'unknown'}; source: ${d.source || 'configured provider'}.`;
    await loadHistory();
  } catch(e) { $('status').textContent = 'Live analysis unavailable: ' + e.message; }
  finally { $('scan').disabled = false; }
});
async function loadHistory(){
  try {
    const rows = await api('/api/signals?limit=20');
    $('history').innerHTML = rows.length ? rows.map(r => `<tr><td>${new Date(r.created_at).toLocaleString()}</td><td>${r.symbol}</td><td class="tag">${r.direction}</td><td>${r.confidence}/100</td><td>${r.status}</td></tr>`).join('') : '<tr><td colspan="5">No saved signals yet.</td></tr>';
  } catch(e) { $('history').innerHTML = '<tr><td colspan="5">Database not configured yet.</td></tr>'; }
}
$('refresh').addEventListener('click', loadHistory);
loadHistory();