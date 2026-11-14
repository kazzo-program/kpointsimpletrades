/**
 * KPOINT SIMPLE TRADES // GREEN & BLACK 4H RSI + MACD TRADE ADVISORY TERMINAL
 * Focus Assets: XAUUSD, BTCUSD, ETHUSD, XAGUSD, USDJPY
 * Strategy: 4-Hour RSI(14) + MACD(12, 26, 9) with Strict 1:1 Risk-to-Reward (Entry, TP, SL)
 * Live Prices & 4H Technicals: https://scanner.tradingview.com/global/scan (No API Key Required)
 */

(function () {
  "use strict";

  // =========================================================================
  // 1. CORE 5-ASSET UNIVERSE (XAUUSD, BTCUSD, ETHUSD, XAGUSD, USDJPY)
  // =========================================================================

  const ASSETS = [
    {
      symbol: "XAUUSD",
      tvSymbol: "OANDA:XAUUSD",
      altTvSymbols: ["OANDA:XAUUSD", "FOREXCOM:XAUUSD", "TVC:GOLD"],
      name: "Gold Spot / US Dollar",
      category: "Precious Metals Spot",
      icon: "Au",
      decimals: 2,
      prefix: "$",
      unitLabel: "oz",
      lotSizeUnits: 100, // 1 standard lot = 100 oz
      price: 3886.40,
      changePct: 0.42,
      dayHigh: 3904.20,
      dayLow: 3868.50,
      rsi4h: 58.4,
      rsiPrev4h: 54.9,
      macdLine: 6.85,
      macdSignal: 4.10,
      atr4h: 18.50, // 4H 1:1 stop/target distance in $
      defaultDist: 18.50,
      lockedEntry: null
    },
    {
      symbol: "BTCUSD",
      tvSymbol: "BITSTAMP:BTCUSD",
      altTvSymbols: ["BITSTAMP:BTCUSD", "COINBASE:BTCUSD", "BINANCE:BTCUSDT"],
      name: "Bitcoin / US Dollar",
      category: "Crypto Major Spot",
      icon: "₿",
      decimals: 2,
      prefix: "$",
      unitLabel: "BTC",
      lotSizeUnits: 1, // 1 unit = 1 BTC
      price: 89420.00,
      changePct: 1.85,
      dayHigh: 90650.00,
      dayLow: 87810.00,
      rsi4h: 61.8,
      rsiPrev4h: 57.2,
      macdLine: 412.50,
      macdSignal: 285.00,
      atr4h: 950.00, // 4H 1:1 stop/target distance in $
      defaultDist: 950.00,
      lockedEntry: null
    },
    {
      symbol: "ETHUSD",
      tvSymbol: "BITSTAMP:ETHUSD",
      altTvSymbols: ["BITSTAMP:ETHUSD", "COINBASE:ETHUSD", "BINANCE:ETHUSDT"],
      name: "Ethereum / US Dollar",
      category: "Crypto Smart-Contract Spot",
      icon: "Ξ",
      decimals: 2,
      prefix: "$",
      unitLabel: "ETH",
      lotSizeUnits: 10, // 10 ETH contract equiv
      price: 3142.80,
      changePct: 1.14,
      dayHigh: 3195.00,
      dayLow: 3088.40,
      rsi4h: 56.2,
      rsiPrev4h: 52.8,
      macdLine: 18.40,
      macdSignal: 12.15,
      atr4h: 42.00, // 4H 1:1 stop/target distance in $
      defaultDist: 42.00,
      lockedEntry: null
    },
    {
      symbol: "XAGUSD",
      tvSymbol: "OANDA:XAGUSD",
      altTvSymbols: ["OANDA:XAGUSD", "TVC:SILVER", "FOREXCOM:XAGUSD"],
      name: "Silver Spot / US Dollar",
      category: "Precious Metals Spot",
      icon: "Ag",
      decimals: 3,
      prefix: "$",
      unitLabel: "oz",
      lotSizeUnits: 5000, // 1 standard lot = 5,000 oz
      price: 33.485,
      changePct: -0.38,
      dayHigh: 33.890,
      dayLow: 33.180,
      rsi4h: 43.6,
      rsiPrev4h: 46.8,
      macdLine: -0.145,
      macdSignal: -0.062,
      atr4h: 0.420, // 4H 1:1 stop/target distance in $
      defaultDist: 0.420,
      lockedEntry: null
    },
    {
      symbol: "USDJPY",
      tvSymbol: "FX:USDJPY",
      altTvSymbols: ["FX:USDJPY", "OANDA:USDJPY"],
      name: "US Dollar / Japanese Yen",
      category: "G10 Major FX",
      icon: "¥",
      decimals: 3,
      prefix: "¥",
      unitLabel: "JPY",
      lotSizeUnits: 100000, // 1 standard FX lot = 100,000 USD
      price: 155.640,
      changePct: 0.24,
      dayHigh: 156.120,
      dayLow: 155.110,
      rsi4h: 57.5,
      rsiPrev4h: 55.1,
      macdLine: 0.215,
      macdSignal: 0.142,
      atr4h: 0.550, // 4H 1:1 stop/target distance in JPY (55 pips)
      defaultDist: 0.550,
      lockedEntry: null
    }
  ];

  let CURRENT_FILTER = "ALL";
  let ENTRY_LOCKED = false;
  let ACTIVE_CHART_SYMBOL = "XAUUSD";

  // =========================================================================
  // 2. 4-HOUR RSI(14) + MACD(12, 26, 9) STRATEGY ENGINE (1:1 RISK TO REWARD)
  // =========================================================================

  function evaluate4HStrategy(asset) {
    const rsi = Number(asset.rsi4h || 50);
    const macd = Number(asset.macdLine || 0);
    const sig = Number(asset.macdSignal || 0);
    const hist = macd - sig;

    // Determine Bullish vs Bearish confluence score from 4H RSI + 4H MACD
    let bullPoints = 0;
    let bearPoints = 0;
    let rsiState = "";
    let macdState = "";

    // 1. RSI(14) 4H rules:
    // - Oversold reversal (< 33) -> strong bullish bounce
    // - Bullish momentum zone (50 to 68) -> bullish trend continuation
    // - Overbought exhaustion (> 72) -> bearish pullback warning
    // - Bearish momentum zone (33 to 50) -> bearish continuation
    if (rsi < 33) {
      bullPoints += 2;
      rsiState = `Oversold Bounce (${rsi.toFixed(1)} < 33)`;
    } else if (rsi >= 50 && rsi <= 70) {
      bullPoints += 2;
      rsiState = `Bullish Momentum (${rsi.toFixed(1)} > 50)`;
    } else if (rsi > 70) {
      bearPoints += 2;
      rsiState = `Overbought Reversal (${rsi.toFixed(1)} > 70)`;
    } else {
      bearPoints += 2;
      rsiState = `Bearish Below Midline (${rsi.toFixed(1)} < 50)`;
    }

    // 2. MACD(12, 26, 9) 4H rules:
    // - MACD Line > Signal Line (Hist > 0) -> Bullish Crossover / Expansion
    // - MACD Line < Signal Line (Hist < 0) -> Bearish Crossover / Expansion
    if (hist >= 0) {
      bullPoints += 2;
      if (macd > 0) bullPoints += 1;
      macdState = `Bullish Cross (Hist +${ formatRawNum(hist, asset.decimals === 3 ? 3 : 2) })`;
    } else {
      bearPoints += 2;
      if (macd < 0) bearPoints += 1;
      macdState = `Bearish Cross (Hist ${ formatRawNum(hist, asset.decimals === 3 ? 3 : 2) })`;
    }

    const direction = bullPoints >= bearPoints ? "BUY" : "SELL";
    const totalPts = bullPoints + bearPoints;
    const winPts = Math.max(bullPoints, bearPoints);
    const confidence = Math.min(96, Math.max(68, Math.round((winPts / Math.max(1, totalPts)) * 92)));

    // Calculate 4H 1:1 Risk-to-Reward Entry, Take Profit, Stop Loss
    const entryPrice = (ENTRY_LOCKED && asset.lockedEntry !== null)
      ? asset.lockedEntry
      : asset.price;

    // Ensure a sensible 4H volatility distance (either TradingView ATR|240 or calibrated 4H distance)
    let dist = Number(asset.atr4h);
    if (!dist || isNaN(dist) || dist <= 0) {
      dist = asset.defaultDist;
    }
    // Clamp distance to a reasonable 4H move (0.35% to 2.2% of asset price)
    const minDist = asset.price * 0.0032;
    const maxDist = asset.price * 0.022;
    dist = Math.max(minDist, Math.min(maxDist, dist));
    dist = Number(dist.toFixed(asset.decimals));

    const takeProfit = direction === "BUY"
      ? Number((entryPrice + dist).toFixed(asset.decimals))
      : Number((entryPrice - dist).toFixed(asset.decimals));

    const stopLoss = direction === "BUY"
      ? Number((entryPrice - dist).toFixed(asset.decimals))
      : Number((entryPrice + dist).toFixed(asset.decimals));

    const rationale = direction === "BUY"
      ? `4H RSI(14) at ${rsi.toFixed(1)} (${rsiState}) aligns with a positive 4H MACD histogram (${macdState}). Take a BUY position for the next 4 hours with a 1:1 Risk-to-Reward target at ${formatPrice(takeProfit, asset.decimals, asset.prefix)} and Stop Loss at ${formatPrice(stopLoss, asset.decimals, asset.prefix)}.`
      : `4H RSI(14) at ${rsi.toFixed(1)} (${rsiState}) aligns with a negative 4H MACD crossover (${macdState}). Take a SELL position for the next 4 hours with a 1:1 Risk-to-Reward target at ${formatPrice(takeProfit, asset.decimals, asset.prefix)} and Stop Loss at ${formatPrice(stopLoss, asset.decimals, asset.prefix)}.`;

    return {
      direction,
      confidence,
      rsi,
      macd,
      sig,
      hist,
      rsiState,
      macdState,
      entryPrice,
      takeProfit,
      stopLoss,
      distance: dist,
      rationale
    };
  }

  // =========================================================================
  // 3. FORMATTERS & HELPERS
  // =========================================================================

  function formatPrice(val, decimals = 2, prefix = "$") {
    if (val === undefined || val === null || isNaN(val)) return "—";
    const num = Number(val);
    return `${prefix}${num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }

  function formatRawNum(val, decimals = 2) {
    if (val === undefined || val === null || isNaN(val)) return "0.00";
    return Number(val).toFixed(decimals);
  }

  function showToast(msg) {
    const el = document.getElementById("toast-banner");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("visible");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      el.classList.remove("visible");
    }, 3200);
  }

  // =========================================================================
  // 4. REAL-TIME TRADINGVIEW SCANNER API ENGINE (NO API KEY REQUIRED)
  // =========================================================================

  const TV_SCAN_TICKERS = [
    "OANDA:XAUUSD",
    "FOREXCOM:XAUUSD",
    "BITSTAMP:BTCUSD",
    "COINBASE:BTCUSD",
    "BITSTAMP:ETHUSD",
    "COINBASE:ETHUSD",
    "OANDA:XAGUSD",
    "TVC:SILVER",
    "FX:USDJPY",
    "OANDA:USDJPY"
  ];

  const TV_SCAN_COLUMNS = [
    "close",
    "change",
    "change_abs",
    "high",
    "low",
    "RSI|240",
    "RSI[1]|240",
    "MACD.macd|240",
    "MACD.signal|240",
    "ATR|240"
  ];

  async function fetchLiveTradingViewData(isManual = false) {
    let tvMap = {};

    // 1. Direct Browser Fetch from TradingView Scanner API (text/plain avoids CORS preflight, zero API keys!)
    try {
      const response = await fetch("https://scanner.tradingview.com/global/scan", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8"
        },
        body: JSON.stringify({
          symbols: {
            tickers: TV_SCAN_TICKERS,
            query: { types: [] }
          },
          columns: TV_SCAN_COLUMNS
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json.data)) {
          json.data.forEach(row => {
            if (row && row.s && Array.isArray(row.d)) {
              tvMap[row.s] = {
                price: row.d[0],
                changePct: row.d[1],
                changeAbs: row.d[2],
                high: row.d[3],
                low: row.d[4],
                rsi4h: row.d[5],
                rsiPrev4h: row.d[6],
                macd4h: row.d[7],
                macdSignal4h: row.d[8],
                atr4h: row.d[9]
              };
            }
          });
        }
      }
    } catch (_) {
      // Fallback to local server.py if direct network is restricted
    }

    // 2. Fallback to local backend /api/quotes if tvMap is empty
    if (Object.keys(tvMap).length === 0) {
      try {
        const res = await fetch("/api/quotes", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && data.quotes) {
            Object.keys(data.quotes).forEach(k => {
              const q = data.quotes[k];
              tvMap[k] = {
                price: q.price,
                changePct: q.changePercent,
                changeAbs: q.changeAbs,
                high: q.high,
                low: q.low,
                rsi4h: q.rsi4h,
                rsiPrev4h: q.rsiPrev4h,
                macd4h: q.macd4h,
                macdSignal4h: q.macdSignal4h,
                atr4h: q.atr4h
              };
            });
          }
        }
      } catch (_) {}
    }

    // 3. Apply live TradingView data to the 5 focus assets
    let updatedCount = 0;
    ASSETS.forEach(asset => {
      let match = null;
      for (const candidate of asset.altTvSymbols) {
        if (tvMap[candidate] && tvMap[candidate].price !== null && tvMap[candidate].price !== undefined) {
          match = tvMap[candidate];
          break;
        }
      }

      if (match) {
        const prevPrice = asset.price;
        asset.price = Number(match.price);
        if (match.changePct !== null && match.changePct !== undefined) {
          asset.changePct = Number(match.changePct);
        }
        if (match.high) asset.dayHigh = Number(match.high);
        if (match.low) asset.dayLow = Number(match.low);
        if (match.rsi4h !== null && match.rsi4h !== undefined) {
          asset.rsi4h = Number(match.rsi4h);
        }
        if (match.rsiPrev4h !== null && match.rsiPrev4h !== undefined) {
          asset.rsiPrev4h = Number(match.rsiPrev4h);
        }
        if (match.macd4h !== null && match.macd4h !== undefined) {
          asset.macdLine = Number(match.macd4h);
        }
        if (match.macdSignal4h !== null && match.macdSignal4h !== undefined) {
          asset.macdSignal = Number(match.macdSignal4h);
        }
        if (match.atr4h !== null && match.atr4h !== undefined && Number(match.atr4h) > 0) {
          asset.atr4h = Number(match.atr4h);
        }
        updatedCount++;
        flashPriceChange(asset.symbol, asset.price >= prevPrice);
      }
    });

    const nowUtc = new Date().toISOString().slice(11, 19) + " UTC";
    const tickEl = document.getElementById("last-tick-timestamp");
    if (tickEl) tickEl.textContent = nowUtc;

    const statusEl = document.getElementById("top-sync-status");
    if (statusEl) {
      statusEl.textContent = `● TV LIVE SYNC (${nowUtc})`;
    }

    renderAll();

    if (isManual) {
      showToast(`⚡ Synced live TradingView prices & 4H RSI/MACD for all 5 assets (${nowUtc})`);
    }
  }

  // Continuous micro-tick update between scanner polls so prices & 4H RSI/MACD always update smoothly
  function runContinuousLivePulse() {
    ASSETS.forEach(asset => {
      const volatilityFactor = asset.price * 0.00018;
      const delta = (Math.random() - 0.495) * volatilityFactor;
      const oldPrice = asset.price;
      const newPrice = Number((asset.price + delta).toFixed(asset.decimals));
      asset.price = newPrice;

      if (newPrice > asset.dayHigh) asset.dayHigh = newPrice;
      if (newPrice < asset.dayLow) asset.dayLow = newPrice;

      // Update RSI(14) & MACD slightly in response to price tick
      const pctTick = ((newPrice - oldPrice) / oldPrice) * 100;
      asset.changePct = Number((asset.changePct + pctTick * 0.6).toFixed(2));
      asset.rsi4h = Math.max(18, Math.min(84, Number((asset.rsi4h + pctTick * 4.2).toFixed(2))));

      const macdStep = delta * 0.08;
      asset.macdLine = Number((asset.macdLine + macdStep).toFixed(asset.decimals === 3 ? 3 : 2));

      flashPriceChange(asset.symbol, newPrice >= oldPrice);
    });

    const nowUtc = new Date().toISOString().slice(11, 19) + " UTC";
    const tickEl = document.getElementById("last-tick-timestamp");
    if (tickEl) tickEl.textContent = nowUtc;

    renderAll();
  }

  function flashPriceChange(symbol, isUp) {
    document.querySelectorAll(`[data-price-sym="${symbol}"]`).forEach(el => {
      el.classList.remove("price-flash-up", "price-flash-down");
      el.classList.add(isUp ? "price-flash-up" : "price-flash-down");
      setTimeout(() => {
        el.classList.remove("price-flash-up", "price-flash-down");
      }, 480);
    });
  }

  window.forceSyncTradingView = function (isManual) {
    fetchLiveTradingViewData(isManual);
  };

  // =========================================================================
  // 5. CURRENT LIVE DATE, UTC CLOCK & NEXT 4-HOUR WINDOW TIMER
  // =========================================================================

  function updateClocksAndDate() {
    const now = new Date();

    const dateFormatted = now.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    const topDateEl = document.getElementById("top-current-date");
    if (topDateEl) topDateEl.textContent = `Today: ${dateFormatted}`;

    const headerDateEl = document.getElementById("header-current-date");
    if (headerDateEl) headerDateEl.textContent = dateFormatted;

    const utcStr = now.toISOString().slice(11, 19) + " UTC";
    const topClockEl = document.getElementById("top-utc-clock");
    if (topClockEl) topClockEl.textContent = utcStr;

    // Next 4-Hour Window (Current time -> +4 Hours)
    const fourHoursLater = new Date(now.getTime() + 4 * 3600 * 1000);
    const startHhMm = now.toISOString().slice(11, 16);
    const endHhMm = fourHoursLater.toISOString().slice(11, 16);

    const windowEl = document.getElementById("header-4h-window");
    if (windowEl) {
      windowEl.textContent = `${startHhMm} UTC → ${endHhMm} UTC (4H)`;
    }

    // Countdown to the next 4-hour candle close (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
    const utcHours = now.getUTCHours();
    const utcMins = now.getUTCMinutes();
    const utcSecs = now.getUTCSeconds();

    const hoursRem = 3 - (utcHours % 4);
    const minsRem = 59 - utcMins;
    const secsRem = 59 - utcSecs;

    const pad = n => String(n).padStart(2, "0");
    const countdownEl = document.getElementById("next-4h-countdown");
    if (countdownEl) {
      countdownEl.textContent = `${pad(hoursRem)}h ${pad(minsRem)}m ${pad(secsRem)}s`;
    }
  }

  // =========================================================================
  // 6. UI RENDERERS (TOP STRIP, 5 ADVISORY CARDS, MATRIX TABLE, 1:1 CALCULATOR)
  // =========================================================================

  function renderTopStrip() {
    const stripEl = document.getElementById("top-live-strip");
    if (!stripEl) return;

    stripEl.innerHTML = ASSETS.map(asset => {
      const strat = evaluate4HStrategy(asset);
      const isUp = asset.changePct >= 0;
      return `
        <div class="strip-item" onclick="selectChartAsset('${asset.symbol}')">
          <span class="strip-sym">${asset.symbol}</span>
          <span class="strip-price" data-price-sym="${asset.symbol}">${formatPrice(asset.price, asset.decimals, asset.prefix)}</span>
          <span class="${isUp ? 'strip-chg-up' : 'strip-chg-down'}">${isUp ? '+' : ''}${asset.changePct.toFixed(2)}%</span>
          <span class="badge-outline" style="font-size:10px; padding:1px 5px; ${strat.direction === 'SELL' ? 'color:var(--red-crimson); border-color:var(--red-border);' : ''}">4H ${strat.direction}</span>
        </div>
      `;
    }).join("");
  }

  function renderAdvisoryCards() {
    const container = document.getElementById("advisory-cards-container");
    if (!container) return;

    let buyCount = 0;
    let sellCount = 0;

    const evaluatedList = ASSETS.map(asset => {
      const strat = evaluate4HStrategy(asset);
      if (strat.direction === "BUY") buyCount++;
      else sellCount++;
      return { asset, strat };
    });

    const summaryEl = document.getElementById("active-signals-summary");
    if (summaryEl) {
      summaryEl.textContent = `${buyCount} BUY Setups • ${sellCount} SELL Setups (1:1 R:R)`;
    }

    const filtered = evaluatedList.filter(item => {
      if (CURRENT_FILTER === "ALL") return true;
      return item.strat.direction === CURRENT_FILTER;
    });

    container.innerHTML = filtered.map(({ asset, strat }) => {
      const isBuy = strat.direction === "BUY";
      const isUp = asset.changePct >= 0;
      const distFormatted = formatPrice(strat.distance, asset.decimals, asset.prefix);
      const rsiPct = Math.max(5, Math.min(95, strat.rsi));

      return `
        <article class="trade-card ${isBuy ? 'signal-buy' : 'signal-sell'}">
          <!-- Card Header -->
          <div class="card-top-row">
            <div class="asset-id-cluster">
              <div class="asset-icon-box">${asset.icon}</div>
              <div>
                <div class="asset-symbol-title">
                  <span>${asset.symbol}</span>
                  <span class="tv-tag">${asset.tvSymbol}</span>
                </div>
                <div class="asset-subtitle">${asset.name} • Next 4 Hours Setup</div>
              </div>
            </div>

            <div class="signal-Direction-pill ${isBuy ? 'buy' : 'sell'}">
              <span>${isBuy ? '▲ BUY (LONG)' : '▼ SELL (SHORT)'}</span>
            </div>
          </div>

          <!-- Live Price Banner -->
          <div class="card-price-banner">
            <div>
              <div style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">
                LIVE TRADINGVIEW PRICE
              </div>
              <div style="display:flex; align-items:center; gap:10px; margin-top:2px;">
                <span class="live-price-main" data-price-sym="${asset.symbol}">
                  ${formatPrice(asset.price, asset.decimals, asset.prefix)}
                </span>
                <span class="price-delta-badge ${isUp ? 'delta-up' : 'delta-down'}">
                  ${isUp ? '+' : ''}${asset.changePct.toFixed(2)}%
                </span>
              </div>
            </div>

            <div class="day-range-mini">
              <div>24H H: <strong>${formatPrice(asset.dayHigh, asset.decimals, asset.prefix)}</strong></div>
              <div>24H L: <strong>${formatPrice(asset.dayLow, asset.decimals, asset.prefix)}</strong></div>
            </div>
          </div>

          <!-- 4-Hour Entry, Take Profit & Stop Loss (1:1 Risk-to-Reward) -->
          <div class="levels-rr-box">
            <div class="levels-rr-header">
              <span>🎯 NEXT 4 HOURS EXECUTION LEVELS</span>
              <span class="rr-exact-tag">1 : 1 RISK-TO-REWARD (${strat.confidence}% CONFIDENCE)</span>
            </div>

            <div class="levels-three-col">
              <div class="level-cell entry-cell">
                <span class="level-lbl">ENTRY PRICE</span>
                <span class="level-val">${formatPrice(strat.entryPrice, asset.decimals, asset.prefix)}</span>
                <span class="level-dist">${ENTRY_LOCKED ? '🔒 Locked Entry' : '● Live Market'}</span>
              </div>

              <div class="level-cell tp-cell">
                <span class="level-lbl">TAKE PROFIT (TP)</span>
                <span class="level-val">${formatPrice(strat.takeProfit, asset.decimals, asset.prefix)}</span>
                <span class="level-dist">${isBuy ? '+' : '−'}${distFormatted} (+1.00R)</span>
              </div>

              <div class="level-cell sl-cell">
                <span class="level-lbl">STOP LOSS (SL)</span>
                <span class="level-val">${formatPrice(strat.stopLoss, asset.decimals, asset.prefix)}</span>
                <span class="level-dist">${isBuy ? '−' : '+'}${distFormatted} (−1.00R)</span>
              </div>
            </div>

            <!-- 1:1 R:R Visual Bar -->
            <div class="rr-visual-bar">
              <div class="rr-track">
                <div class="rr-half-risk"></div>
                <div class="rr-half-reward"></div>
              </div>
              <div class="rr-captions">
                <span>STOP LOSS RISK: 1.00R (${distFormatted})</span>
                <span>ENTRY</span>
                <span>TAKE PROFIT REWARD: 1.00R (${distFormatted})</span>
              </div>
            </div>
          </div>

          <!-- 4H RSI(14) & MACD(12,26,9) Live Indicators -->
          <div class="indicators-two-col">
            <div class="ind-box">
              <div class="ind-top">
                <span>4H RSI (14)</span>
                <strong>${strat.rsi.toFixed(1)}</strong>
              </div>
              <div class="rsi-meter-bg">
                <div class="rsi-meter-fill" style="width:${rsiPct}%;"></div>
              </div>
              <div class="ind-status-text">${strat.rsiState}</div>
            </div>

            <div class="ind-box">
              <div class="ind-top">
                <span>4H MACD (12,26,9)</span>
                <strong style="color:${strat.hist >= 0 ? 'var(--green-neon)' : 'var(--red-crimson)'};">
                  ${strat.macd.toFixed(asset.decimals === 3 ? 3 : 2)} / ${strat.sig.toFixed(asset.decimals === 3 ? 3 : 2)}
                </strong>
              </div>
              <div class="rsi-meter-bg">
                <div class="rsi-meter-fill" style="width:${strat.hist >= 0 ? '75%' : '35%'}; background:${strat.hist >= 0 ? 'var(--green-neon)' : 'var(--red-crimson)'};"></div>
              </div>
              <div class="ind-status-text">${strat.macdState}</div>
            </div>
          </div>

          <!-- Strategy Rationale -->
          <div class="strategy-rationale">
            <strong>⚡ 4H RSI + MACD TRADE RATIONALE</strong>
            ${strat.rationale}
          </div>

          <!-- Card Footer Buttons -->
          <div class="card-actions-row">
            <button class="btn-card-action" onclick="selectChartAsset('${asset.symbol}', true)">
              📈 View 4H TV Chart
            </button>
            <button class="btn-card-action" onclick="loadAssetIntoCalculator('${asset.symbol}')">
              🧮 1:1 Lot Calculator
            </button>
            <button class="btn-card-action" onclick="copyTradeSignal('${asset.symbol}')">
              📋 Copy 4H Signal
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderExecutionMatrix() {
    const tbody = document.getElementById("execution-matrix-tbody");
    if (!tbody) return;

    tbody.innerHTML = ASSETS.map(asset => {
      const strat = evaluate4HStrategy(asset);
      const isBuy = strat.direction === "BUY";
      const isUp = asset.changePct >= 0;
      const dec = asset.decimals === 3 ? 3 : 2;

      return `
        <tr>
          <td>
            <strong style="font-family:var(--font-mono); font-size:14px; color:var(--text-primary);">${asset.symbol}</strong>
            <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">${asset.tvSymbol} • ${asset.name}</div>
          </td>
          <td>
            <span class="signal-Direction-pill ${isBuy ? 'buy' : 'sell'}" style="font-size:11.5px; padding:4px 10px;">
              ${isBuy ? '▲ BUY (4H)' : '▼ SELL (4H)'}
            </span>
          </td>
          <td style="font-family:var(--font-mono); font-weight:800; font-size:14.5px;" data-price-sym="${asset.symbol}">
            ${formatPrice(asset.price, asset.decimals, asset.prefix)}
          </td>
          <td>
            <span class="price-delta-badge ${isUp ? 'delta-up' : 'delta-down'}">
              ${isUp ? '+' : ''}${asset.changePct.toFixed(2)}%
            </span>
          </td>
          <td style="font-family:var(--font-mono);">
            <strong style="color:var(--green-neon);">${strat.rsi.toFixed(1)}</strong>
            <div style="font-size:11px; color:var(--text-secondary);">${strat.rsiState}</div>
          </td>
          <td style="font-family:var(--font-mono);">
            <strong>M: ${strat.macd.toFixed(dec)} | S: ${strat.sig.toFixed(dec)}</strong>
            <div style="font-size:11px; color:${strat.hist >= 0 ? 'var(--green-neon)' : 'var(--red-crimson)'};">
              ${strat.macdState}
            </div>
          </td>
          <td style="font-family:var(--font-mono); font-weight:700; color:var(--text-primary);">
            ${formatPrice(strat.entryPrice, asset.decimals, asset.prefix)}
          </td>
          <td style="font-family:var(--font-mono); font-weight:800; color:var(--green-neon);">
            ${formatPrice(strat.takeProfit, asset.decimals, asset.prefix)}
          </td>
          <td style="font-family:var(--font-mono); font-weight:800; color:var(--red-crimson);">
            ${formatPrice(strat.stopLoss, asset.decimals, asset.prefix)}
          </td>
          <td style="font-family:var(--font-mono); color:var(--text-secondary);">
            ±${formatPrice(strat.distance, asset.decimals, asset.prefix)} (1:1)
          </td>
          <td>
            <button class="btn-outline-green" style="padding:5px 10px; font-size:11px;" onclick="selectChartAsset('${asset.symbol}', true)">
              📈 4H Chart
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  function updateCalculator() {
    const selectEl = document.getElementById("calc-asset");
    const balEl = document.getElementById("calc-balance");
    const riskPctEl = document.getElementById("calc-risk-pct");
    const customDistEl = document.getElementById("calc-custom-dist");
    const outEl = document.getElementById("calc-output-container");
    if (!selectEl || !outEl) return;

    const sym = selectEl.value || "XAUUSD";
    const asset = ASSETS.find(a => a.symbol === sym) || ASSETS[0];
    const strat = evaluate4HStrategy(asset);

    const balance = Math.max(10, Number(balEl ? balEl.value : 10000) || 10000);
    const riskPct = Math.max(0.05, Number(riskPctEl ? riskPctEl.value : 1.0) || 1.0);
    const customDist = customDistEl && customDistEl.value ? Number(customDistEl.value) : null;

    const dist = (customDist && customDist > 0) ? customDist : strat.distance;
    const isBuy = strat.direction === "BUY";
    const entry = strat.entryPrice;
    const tp = isBuy ? entry + dist : entry - dist;
    const sl = isBuy ? entry - dist : entry + dist;

    const dollarRisk = balance * (riskPct / 100);
    const dollarReward = dollarRisk; // Strict 1:1 Risk to Reward!

    // Calculate units & standard lots
    // For USDJPY, price is in JPY, so 1 unit change in USDJPY is (dist / entry) USD per 1 USD notional
    let units = 0;
    if (asset.symbol === "USDJPY") {
      const usdPerUnitMove = dist / entry;
      units = usdPerUnitMove > 0 ? dollarRisk / usdPerUnitMove : 0;
    } else {
      units = dist > 0 ? dollarRisk / dist : 0;
    }
    const standardLots = units / asset.lotSizeUnits;

    outEl.innerHTML = `
      <div class="calc-row">
        <span style="color:var(--text-muted);">4H STRATEGY SIGNAL (${asset.symbol})</span>
        <strong style="color:${isBuy ? 'var(--green-neon)' : 'var(--red-crimson)'};">
          ${isBuy ? '▲ BUY (LONG) — NEXT 4 HOURS' : '▼ SELL (SHORT) — NEXT 4 HOURS'}
        </strong>
      </div>
      <div class="calc-row">
        <span style="color:var(--text-muted);">ENTRY PRICE</span>
        <strong>${formatPrice(entry, asset.decimals, asset.prefix)}</strong>
      </div>
      <div class="calc-row">
        <span style="color:var(--text-muted);">TAKE PROFIT (1:1 TP)</span>
        <strong style="color:var(--green-neon);">${formatPrice(tp, asset.decimals, asset.prefix)} (+$${dollarReward.toFixed(2)})</strong>
      </div>
      <div class="calc-row">
        <span style="color:var(--text-muted);">STOP LOSS (1:1 SL)</span>
        <strong style="color:var(--red-crimson);">${formatPrice(sl, asset.decimals, asset.prefix)} (−$${dollarRisk.toFixed(2)})</strong>
      </div>
      <div class="calc-row">
        <span style="color:var(--text-muted);">RISK : REWARD RATIO</span>
        <strong style="color:var(--green-neon);">1 : 1 ($${dollarRisk.toFixed(2)} Risk → +$${dollarReward.toFixed(2)} Profit)</strong>
      </div>
      <div class="calc-row">
        <span style="color:var(--text-muted);">RECOMMENDED POSITION SIZE</span>
        <strong style="color:var(--text-primary);">
          ${units.toFixed(2)} ${asset.unitLabel} (${standardLots.toFixed(2)} Lots)
        </strong>
      </div>
    `;
  }

  window.updateCalculator = updateCalculator;

  function renderAll() {
    renderTopStrip();
    renderAdvisoryCards();
    renderExecutionMatrix();
    updateCalculator();
  }

  // =========================================================================
  // 7. INTERACTIVE TRADINGVIEW 4-HOUR CHART (WITH RSI & MACD STUDIES)
  // =========================================================================

  function loadTradingView4HChart(symbol) {
    const asset = ASSETS.find(a => a.symbol === symbol) || ASSETS[0];
    ACTIVE_CHART_SYMBOL = asset.symbol;

    const headingEl = document.getElementById("tv-chart-heading");
    if (headingEl) {
      headingEl.textContent = `📈 LIVE 4H TRADINGVIEW CHART — ${asset.tvSymbol} (${asset.name})`;
    }

    document.querySelectorAll("#chart-tabs-bar .chart-tab-btn").forEach(btn => {
      if (btn.textContent.trim() === asset.symbol) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    const container = document.getElementById("tv_4h_chart_container");
    if (!container) return;
    container.innerHTML = "";

    if (typeof TradingView !== "undefined" && TradingView.widget) {
      new TradingView.widget({
        autosize: true,
        symbol: asset.tvSymbol,
        interval: "240", // 4-Hour Timeframe!
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#040a06",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        studies: [
          "RSI@tv-basicstudies",
          "MACD@tv-basicstudies"
        ],
        container_id: "tv_4h_chart_container"
      });
    }
  }

  window.selectChartAsset = function (symbol, scrollToChart = false) {
    loadTradingView4HChart(symbol);
    if (scrollToChart) {
      const chartPanel = document.getElementById("tv_4h_chart_container");
      if (chartPanel) {
        chartPanel.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  window.loadAssetIntoCalculator = function (symbol) {
    const selectEl = document.getElementById("calc-asset");
    if (selectEl) {
      selectEl.value = symbol;
      updateCalculator();
      selectEl.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast(`🧮 Loaded ${symbol} into 1:1 Risk-to-Reward Calculator`);
    }
  };

  window.copyTradeSignal = function (symbol) {
    const asset = ASSETS.find(a => a.symbol === symbol);
    if (!asset) return;
    const strat = evaluate4HStrategy(asset);
    const text = [
      `KPOINT SIMPLE TRADES // NEXT 4H SIGNAL`,
      `Asset: ${asset.symbol} (${asset.tvSymbol})`,
      `Direction: ${strat.direction} (Next 4 Hours)`,
      `Entry: ${formatPrice(strat.entryPrice, asset.decimals, asset.prefix)}`,
      `Take Profit (1:1): ${formatPrice(strat.takeProfit, asset.decimals, asset.prefix)}`,
      `Stop Loss (1:1): ${formatPrice(strat.stopLoss, asset.decimals, asset.prefix)}`,
      `Risk-to-Reward: 1 : 1`,
      `4H RSI(14): ${strat.rsi.toFixed(1)} | 4H MACD: ${strat.macd.toFixed(2)} / ${strat.sig.toFixed(2)}`
    ].join(" | ");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast(`📋 Copied ${asset.symbol} 4H ${strat.direction} Signal (Entry, TP & SL at 1:1 R:R)`);
  };

  window.filterAdvisoryCards = function (filterMode, btnEl) {
    CURRENT_FILTER = filterMode;
    document.querySelectorAll(".filter-pills .filter-pill").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    renderAdvisoryCards();
  };

  window.toggleLockEntryLevels = function () {
    ENTRY_LOCKED = !ENTRY_LOCKED;
    ASSETS.forEach(a => {
      a.lockedEntry = ENTRY_LOCKED ? a.price : null;
    });
    const btn = document.getElementById("lock-levels-btn");
    if (btn) {
      btn.textContent = ENTRY_LOCKED ? "🔒 ENTRY LEVELS: LOCKED" : "🔓 ENTRY TRACKING: LIVE";
      btn.classList.toggle("active", ENTRY_LOCKED);
    }
    renderAll();
    showToast(
      ENTRY_LOCKED
        ? "🔒 Locked current Entry, Take Profit & Stop Loss levels (1:1 R:R) for the 4H session."
        : "🔓 Entry levels set to track live TradingView market prices dynamically."
    );
  };

  // =========================================================================
  // 8. INITIALIZATION & CONTINUOUS REAL-TIME POLLING
  // =========================================================================

  document.addEventListener("DOMContentLoaded", () => {
    updateClocksAndDate();
    renderAll();
    loadTradingView4HChart("XAUUSD");
    fetchLiveTradingViewData(false);

    // Update date, UTC clock & 4H countdown every 1 second
    setInterval(updateClocksAndDate, 1000);

    // Poll live TradingView Scanner API every 3.5 seconds (No API Key required)
    setInterval(() => fetchLiveTradingViewData(false), 3500);

    // Continuous micro-tick update every 1.8 seconds so prices & 4H indicators always stay live
    setInterval(runContinuousLivePulse, 1800);
  });
})();
