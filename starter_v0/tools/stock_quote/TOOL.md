---
name: stock_quote
track: custom
kind: mock_api
requires_env: []
inputs: [symbol, currency]
outputs: [symbol, price, change_percent, market_cap, status]
side_effect: false
---
# stock_quote

Fetches stock market quotes and financial metrics for a ticker symbol.
