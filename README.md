[English](README.md) | [简体中文](README.zh-CN.md)

# 淘宝订单提取器 (Taobao Order Extractor)

[![Greasy Fork](https://img.shields.io/greasyfork/v/576039)](https://greasyfork.org/en/scripts/576039-%E6%B7%98%E5%AE%9D%E8%AE%A2%E5%8D%95%E6%8F%90%E5%8F%96%E5%99%A8)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Tampermonkey/Greasemonkey userscript that extracts recent Taobao order information and formats it as TSV for easy pasting into spreadsheets.

## Features

- Extracts orders from the past 7 days
- Retrieves logistics/tracking information for each order, including multi-package orders
- Extracts per-item prices
- Formats output as TSV (tab-separated values) for pasting into Google Sheets, Tencent Docs, Excel, etc.
- Supports multiple Taobao order page layouts (old, new, and current)
- Automatically skips direct shipping (官方直邮) orders and free gift items
- One-click copy to clipboard

## Installation

### From Greasy Fork (recommended)

Install directly from [Greasy Fork](https://greasyfork.org/en/scripts/576039-%E6%B7%98%E5%AE%9D%E8%AE%A2%E5%8D%95%E6%8F%90%E5%8F%96%E5%99%A8) — auto-updates included.

### Manual install

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox)

2. Click the link below to install the script:
   - [Install taobao-order-extractor.user.js](../../raw/master/taobao-order-extractor.user.js)

## Usage

1. Navigate to your [Taobao order list](https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm)
2. Click the floating "📋 提取本周订单" button
3. The extracted TSV is copied to your clipboard — paste directly into your spreadsheet

## Output Format

The extracted data is copied as TSV with these columns:

| 序号 | 商品名称 | 实付款 | 快递公司 | 快递单号 |
|------|----------|--------|----------|----------|
| 1 | 瑜伽垫平板支撑核心训练 | 52.58 | 中通快递 | 78993339108762 |
| 2 | 瑜伽砖女高密度成人舞蹈练功砖 | 35.42 | 顺丰速运 | SF0229051657614 |

- Multi-package orders: each item gets its own row with its own tracking number
- Multi-item single-package orders: combined into one row with names joined by " + "

## License

[MIT](LICENSE)
