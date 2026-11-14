# kpointsimpletrades — Green & Black 4H RSI + MACD Strategy Terminal (1:1 R:R)

**kpointsimpletrades** is a real-time **Green & Black** quantitative trading advisory web application that uses the **4-Hour (4H) RSI(14) + MACD(12, 26, 9) Strategy** to advise traders what trades to take for the **next 4 hours**, complete with exact **Entry**, **Take Profit (TP)**, and **Stop Loss (SL)** levels at a strict **1:1 Risk-to-Reward ratio (`1.00R : 1.00R`)**.

---

## 🎯 Core Focus Assets (5 Premier Instruments)
1. **XAUUSD** (`OANDA:XAUUSD` — Gold Spot / US Dollar)
2. **BTCUSD** (`BITSTAMP:BTCUSD` — Bitcoin / US Dollar)
3. **ETHUSD** (`BITSTAMP:ETHUSD` — Ethereum / US Dollar)
4. **XAGUSD** (`OANDA:XAGUSD` / `TVC:SILVER` — Silver Spot / US Dollar)
5. **USDJPY** (`FX:USDJPY` — US Dollar / Japanese Yen)

---

## ⚡ Key Features
- **Cyber-Matrix Green & Jet-Black Interface**: High-contrast obsidian black (`#020503`) and neon emerald green (`#00ff88` / `#10b981`) institutional trading interface.
- **Live TradingView Prices & 4H Indicators (No API Key Required)**:
  - Pulls live prices and 4-Hour (`|240`) technical indicators directly from `https://scanner.tradingview.com/global/scan` every 3.5 seconds with continuous real-time updates.
  - Embeds the official **TradingView Live Ticker Tape** and **Interactive 4-Hour TradingView Chart** pre-loaded with **RSI(14)** and **MACD(12, 26, 9)**.
- **4-Hour RSI + MACD Strategy Engine**:
  - Evaluates 4-Hour **RSI(14)** momentum and **MACD(12, 26, 9)** line/signal crossovers to issue actionable **BUY (LONG)** or **SELL (SHORT)** advisories for the next 4 hours.
- **Strict 1:1 Risk-to-Reward (`1.00R : 1.00R`) Execution Levels**:
  - Automatically computes **Entry Price**, **Take Profit (TP)**, and **Stop Loss (SL)** where `|Take Profit - Entry| = |Entry - Stop Loss|`.
  - Includes an interactive **1:1 R:R Position Size & PnL Calculator** and **Entry Lock** toggle.
- **Live Current Date & 4H Candle Countdown**:
  - Displays today's current live date, live UTC clock, the active 4-Hour trading horizon (`HH:MM UTC → HH:MM UTC`), and a second-by-second countdown to the next 4H candle close.

---

## 🚀 Running Locally

You can open `index.html` directly in any modern browser, or run the included zero-dependency Python server:

```bash
python server.py
```

Then open **http://localhost:8080** in your browser.
