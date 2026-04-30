[English](README.md) | [简体中文](README.zh-CN.md)

# 淘宝订单提取器 (Taobao Order Extractor)

A Tampermonkey/Greasemonkey userscript that extracts recent Taobao order information and formats it as TSV for easy pasting into spreadsheets.

## Features

- Extracts orders from the past 7 days
- Retrieves logistics/tracking information for each order
- Formats output as TSV (tab-separated values) for pasting into Google Sheets, Tencent Docs, etc.
- Supports both old and new Taobao order page layouts
- One-click copy to clipboard

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox)

2. Click the link below to install the script:
   - [Install taobao-order-extractor.user.js](../../raw/master/taobao-order-extractor.user.js)

3. Navigate to your [Taobao order list](https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm) and click the floating "📋 提取本周订单" button.

## Output Format

The extracted data is copied as TSV with these columns:

| # | 商品 | 实付 | 快递公司 | 快递单号 |
|---|------|------|----------|----------|
| 1 | Item name | 99.00 | SF Express | SF1234567890 |

## License

[MIT](LICENSE)
