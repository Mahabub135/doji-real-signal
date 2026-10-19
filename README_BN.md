# Quotex-style Live Signal Starter (বাংলা)

এটি একটি starter project: responsive dashboard, Node.js/Express API, PostgreSQL schema, RSI, MACD, EMA 9/21/50, Stochastic, ADX, ATR, Bollinger Bands ও momentum-ভিত্তিক signal engine, signal history এবং basic admin endpoints।

## গুরুত্বপূর্ণ সীমাবদ্ধতা
- 100% accuracy সম্ভব নয়। এই প্রজেক্ট কোনো লাভ বা নির্ভুলতার নিশ্চয়তা দেয় না।
- Forex provider-এর ডেটা আর এই প্রজেক্টে OTC বাদ দেওয়া হয়েছে; কেবল সমর্থিত real Forex data symbols রাখা হয়েছে।
- Demo/paper testing ছাড়া বাস্তব টাকা দিয়ে ব্যবহার করবেন না।
- Admin login starter হিসেবে রাখা হয়েছে; production-এর আগে শক্তিশালী authentication, rate limiting, HTTPS, audit logging ও secret management যোগ করুন।

## দরকার
- Node.js 20+
- PostgreSQL
- Market data API key (Twelve Data বা সমতুল্য provider; provider plan/limits যাচাই করুন)

## Android ফোনে চালানোর সহজ উপায়
1. ZIP Extract করুন কোনো Android file manager দিয়ে।
2. GitHub Codespaces / Replit-এর মতো browser-based Node environment-এ ফাইল আপলোড করুন, অথবা Termux-এ Node.js ও PostgreSQL আলাদাভাবে সেটআপ করুন।
3. `npm install`
4. `.env.example` কপি করে `.env` করুন এবং API key / database URL / admin credentials বসান।
5. PostgreSQL-এ `database/schema.sql` চালান।
6. `npm run dev`
7. Browser-এ `http://localhost:3000` খুলুন।

## API routes
- `GET /api/health`
- `GET /api/assets`
- `GET /api/market/candles?symbol=EUR/USD&interval=1min`
- `GET /api/signals`
- `POST /api/signals/scan` (API key configured থাকলে market candles বিশ্লেষণ করে)

`POST /api/signals/scan`-এ symbol whitelist-এর বাইরে কিছু দেবেন না। API provider-এর symbol/interval support ও rate limit পরীক্ষা করুন।
