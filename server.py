#!/usr/bin/env python3
"""
kpointsimpletrades // GREEN & BLACK 4H RSI + MACD TRADE ADVISORY TERMINAL
Live TradingView Scanner API Backend (No API Keys Required)
Focus Assets: XAUUSD, BTCUSD, ETHUSD, XAGUSD, USDJPY
Strategy: 4-Hour RSI(14) + MACD(12, 26, 9) with Strict 1:1 Risk-to-Reward (Entry, TP, SL)
"""

import os
import json
import time
import urllib.request
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from datetime import datetime, timezone

PORT = 8080
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))

TV_TICKERS = [
    "OANDA:XAUUSD",
    "BITSTAMP:BTCUSD",
    "BITSTAMP:ETHUSD",
    "OANDA:XAGUSD",
    "TVC:SILVER",
    "FX:USDJPY"
]

TV_COLUMNS = [
    "close",
    "change",
    "change_abs",
    "high",
    "low",
    "RSI|240",
    "RSI[1]|240",
    "MACD.macd|240",
    "MACD.signal|240",
    "Recommend.All|240",
    "EMA50|240",
    "EMA200|240",
    "ATR|240"
]

CACHE = {
    "quotes": {"data": None, "time": 0}
}


def fetch_tradingview_live():
    now = time.time()
    if CACHE["quotes"]["data"] and (now - CACHE["quotes"]["time"]) < 2.5:
        return CACHE["quotes"]["data"]

    url = "https://scanner.tradingview.com/global/scan"
    payload = json.dumps({
        "symbols": {"tickers": TV_TICKERS, "query": {"types": []}},
        "columns": TV_COLUMNS
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Content-Type": "text/plain;charset=UTF-8"
            }
        )
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            out = {}
            for row in data.get("data", []):
                sym = row.get("s")
                d = row.get("d", [])
                if sym and len(d) >= 5:
                    out[sym] = {
                        "price": d[0],
                        "changePercent": d[1],
                        "changeAbs": d[2],
                        "high": d[3],
                        "low": d[4],
                        "rsi4h": d[5] if len(d) > 5 else None,
                        "rsiPrev4h": d[6] if len(d) > 6 else None,
                        "macd4h": d[7] if len(d) > 7 else None,
                        "macdSignal4h": d[8] if len(d) > 8 else None,
                        "recommend4h": d[9] if len(d) > 9 else None,
                        "ema50_4h": d[10] if len(d) > 10 else None,
                        "ema200_4h": d[11] if len(d) > 11 else None,
                        "atr4h": d[12] if len(d) > 12 else None
                    }
            if out:
                CACHE["quotes"]["data"] = out
                CACHE["quotes"]["time"] = now
            return out
    except Exception:
        return CACHE["quotes"]["data"] or {}


class KpointSimpleTradesHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORKSPACE_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path in ("/api/quotes", "/api/all"):
            self.send_json({
                "status": "ONLINE",
                "terminal": "kpointsimpletrades // 4H RSI + MACD (1:1 R:R)",
                "source": "TradingView Live Scanner API (No API Key)",
                "assets": ["XAUUSD", "BTCUSD", "ETHUSD", "XAGUSD", "USDJPY"],
                "quotes": fetch_tradingview_live(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            return
        super().do_GET()

    def send_json(self, payload, status=200):
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run_server():
    httpd = HTTPServer(("", PORT), KpointSimpleTradesHandler)
    print("=" * 76)
    print("  kpointsimpletrades // GREEN & BLACK 4H RSI + MACD TERMINAL")
    print(f"  Local URL: http://localhost:{PORT}")
    print("  Assets: XAUUSD • BTCUSD • ETHUSD • XAGUSD • USDJPY (1:1 Risk-to-Reward)")
    print("  Live Feed: https://scanner.tradingview.com/global/scan (No API Key)")
    print("=" * 76)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()


if __name__ == "__main__":
    run_server()
