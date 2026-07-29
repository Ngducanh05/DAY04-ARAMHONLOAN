from __future__ import annotations

from typing import Any

from tools._shared import err


MOCK_STOCKS: dict[str, dict[str, Any]] = {
    "AAPL": {"price": 225.50, "change_percent": "+1.2%", "company": "Apple Inc.", "currency": "USD"},
    "NVDA": {"price": 122.80, "change_percent": "+3.5%", "company": "NVIDIA Corporation", "currency": "USD"},
    "MSFT": {"price": 448.90, "change_percent": "-0.4%", "company": "Microsoft Corporation", "currency": "USD"},
    "TSLA": {"price": 218.40, "change_percent": "+2.1%", "company": "Tesla Inc.", "currency": "USD"},
    "FPT": {"price": 132000, "change_percent": "+0.8%", "company": "FPT Corporation", "currency": "VND"},
    "VNM": {"price": 67500, "change_percent": "-0.2%", "company": "Vinamilk", "currency": "VND"},
}


def stock_quote(symbol: str, currency: str = "USD") -> dict[str, Any]:
    try:
        sym = symbol.strip().upper()
        data = MOCK_STOCKS.get(sym, {
            "price": 100.00,
            "change_percent": "+0.0%",
            "company": f"{sym} Corporation",
            "currency": currency.upper(),
        })
        return {
            "tool": "stock_quote",
            "symbol": sym,
            "company": data["company"],
            "price": data["price"],
            "change_percent": data["change_percent"],
            "currency": data["currency"],
        }
    except Exception as exc:
        return err("stock_quote", exc)
