function ema(values, period) {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let result = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (const value of values.slice(period)) result = value * k + result * (1 - k);
  return result;
}
function sma(values, period) {
  if (values.length < period) return null;
  const chunk = values.slice(-period);
  return chunk.reduce((a,b)=>a+b,0)/period;
}
function stddev(values, period) {
  if (values.length < period) return null;
  const avg = sma(values, period);
  return Math.sqrt(values.slice(-period).reduce((sum,v)=>sum+((v-avg)**2),0)/period);
}
function rsi(values, period = 14) {
  if (values.length <= period) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}
function macd(values) {
  if (values.length < 35) return null;
  const line = ema(values.slice(-35), 12) - ema(values.slice(-35), 26);
  // Calculate a series of MACD points to estimate the signal line.
  const points = [];
  for (let i = 26; i <= values.length; i++) {
    const sample = values.slice(0, i);
    points.push(ema(sample, 12) - ema(sample, 26));
  }
  const signal = ema(points, 9);
  return { line, signal, histogram: line - (signal ?? 0) };
}
function atr(candles, period=14) {
  if (candles.length < period + 1) return null;
  const trs = [];
  for (let i=1;i<candles.length;i++) {
    const c=candles[i], prev=candles[i-1];
    trs.push(Math.max(c.high-c.low, Math.abs(c.high-prev.close), Math.abs(c.low-prev.close)));
  }
  return sma(trs, period);
}
function stochastic(candles, period=14) {
  if (candles.length < period) return null;
  const window=candles.slice(-period);
  const high=Math.max(...window.map(c=>c.high)), low=Math.min(...window.map(c=>c.low));
  if (high===low) return 50;
  return ((candles[candles.length-1].close-low)/(high-low))*100;
}
function adx(candles, period=14) {
  if (candles.length < period+2) return null;
  const recent=candles.slice(-(period+1));
  let plus=0, minus=0, trs=0;
  for(let i=1;i<recent.length;i++){
    const up=recent[i].high-recent[i-1].high;
    const down=recent[i-1].low-recent[i].low;
    plus += (up>down && up>0)?up:0;
    minus += (down>up && down>0)?down:0;
    trs += Math.max(recent[i].high-recent[i].low,Math.abs(recent[i].high-recent[i-1].close),Math.abs(recent[i].low-recent[i-1].close));
  }
  if(!trs) return 0;
  const pdi=100*plus/trs, mdi=100*minus/trs;
  return (pdi+mdi) ? 100*Math.abs(pdi-mdi)/(pdi+mdi) : 0;
}
function analyze(candles) {
  if (!Array.isArray(candles) || candles.length < 60 || candles.some(c => !Number.isFinite(c.close))) {
    return { direction:'NO TRADE', confidence:0, reason:'At least 60 valid candles are required', indicators:{} };
  }
  const closes=candles.map(c=>c.close);
  const last=closes[closes.length-1], prev=closes[closes.length-2];
  const e9=ema(closes,9), e21=ema(closes,21), e50=ema(closes,50);
  const r=rsi(closes,14), m=macd(closes), a=atr(candles,14);
  const s=stochastic(candles,14), trend=adx(candles,14);
  const bbMid=sma(closes,20), bbStd=stddev(closes,20);
  const bbUpper=bbMid!==null&&bbStd!==null?bbMid+2*bbStd:null;
  const bbLower=bbMid!==null&&bbStd!==null?bbMid-2*bbStd:null;
  const priceMomentum=last-prev;
  const checks = [
    {name:'EMA 9/21 trend', up:e9>e21, down:e9<e21, weight:2},
    {name:'EMA 21/50 trend', up:e21>e50, down:e21<e50, weight:2},
    {name:'MACD histogram', up:m && m.histogram>0, down:m && m.histogram<0, weight:2},
    {name:'RSI filter', up:r>=52&&r<70, down:r<=48&&r>30, weight:1},
    {name:'Stochastic', up:s>50&&s<85, down:s<50&&s>15, weight:1},
    {name:'Price momentum', up:priceMomentum>0, down:priceMomentum<0, weight:1}
  ];
  let up=0, down=0;
  for(const c of checks){if(c.up)up+=c.weight;if(c.down)down+=c.weight;}
  const max=9;
  let direction='NO TRADE';
  if(up>=6 && up-down>=3) direction='CALL';
  else if(down>=6 && down-up>=3) direction='PUT';
  // Confidence is a heuristic agreement score, not a calibrated win probability.
  const score=Math.round((Math.max(up,down)/max)*100);
  const reasons=checks.filter(c=>direction==='CALL'?c.up:direction==='PUT'?c.down:(c.up||c.down)).map(c=>c.name);
  return {
    direction, confidence:direction==='NO TRADE'?0:Math.min(85,score),
    reason:direction==='NO TRADE'?'Indicators do not align strongly; wait for confirmation':`Agreement: ${reasons.join(', ')}`,
    indicators:{
      rsi:Number(r.toFixed(2)), macd:Number(m.line.toFixed(7)),
      macdSignal:Number(m.signal.toFixed(7)), macdHistogram:Number(m.histogram.toFixed(7)),
      ema9:Number(e9.toFixed(7)), ema21:Number(e21.toFixed(7)), ema50:Number(e50.toFixed(7)),
      atr:a===null?null:Number(a.toFixed(7)), stochastic:Number(s.toFixed(2)),
      adx:trend===null?null:Number(trend.toFixed(2)),
      bollingerUpper:bbUpper===null?null:Number(bbUpper.toFixed(7)),
      bollingerMiddle:bbMid===null?null:Number(bbMid.toFixed(7)),
      bollingerLower:bbLower===null?null:Number(bbLower.toFixed(7)),
      priceMomentum:Number(priceMomentum.toFixed(7))
    }
  };
}
module.exports={ema,sma,stddev,rsi,macd,atr,stochastic,adx,analyze};
